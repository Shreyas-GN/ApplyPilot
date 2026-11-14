import { createHash, randomUUID } from 'node:crypto'
import { prisma } from '@/lib/db/prisma'
import type { ResumeDto, ResumeParsedDataDto } from '@/lib/types'
import {
  hasAllowedResumeExtension,
  RESUME_ALLOWED_MIME_TYPES,
  RESUME_MAX_FILE_SIZE_BYTES,
  resumeParsedDataSchema,
  type ResumeParsedData,
} from '@applypilot/validators'
import { createAdminClient } from '@/lib/supabase/admin'
import { sniffFileType, mimeTypeMatchesSniffedType } from './file-signature'
import { recordAudit } from './audit'
import { applyParsedResumeData } from './profile'
import { processResumeBackground } from './resume-parsing'

const DOWNLOAD_URL_TTL_SECONDS = 300

export interface UploadFileInput {
  filename: string
  mimeType: string
  size: number
  buffer: Buffer
}

export async function listResumes(userId: string): Promise<ResumeDto[]> {
  const rows = await prisma.resume.findMany({
    where: { userId },
    include: { parsedData: true },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map((r) => toResumeDto(r, r.parsedData))
}

export async function getResume(userId: string, resumeId: string): Promise<ResumeDto> {
  const row = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: { parsedData: true },
  })
  if (!row || row.userId !== userId) throw new Error('Resume not found.')
  return toResumeDto(row, row.parsedData)
}

export async function uploadResume(
  userId: string,
  file: UploadFileInput,
  versionLabel?: string
): Promise<ResumeDto> {
  validateUpload(file)

  const checksum = createHash('sha256').update(file.buffer).digest('hex')
  const resumeId = randomUUID()
  const ext = file.filename.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf'
  const storageKey = `${userId}/${resumeId}.${ext}`

  const supabase = createAdminClient()
  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(storageKey, file.buffer, { contentType: file.mimeType, upsert: true })

  if (uploadError) throw new Error(`Failed to store resume file: ${uploadError.message}`)

  const existingCount = await prisma.resume.count({ where: { userId } })
  const isPrimary = existingCount === 0

  try {
    const inserted = await prisma.resume.create({
      data: {
        id: resumeId,
        userId,
        versionLabel: versionLabel?.trim() || file.filename,
        originalFilename: file.filename,
        mimeType: file.mimeType,
        fileSizeBytes: file.size,
        storageKey,
        checksum,
        isPrimary,
        processingStatus: 'uploaded',
      },
    })

    await recordAudit(userId, 'resume_uploaded', { resumeId })
    return toResumeDto(inserted, null)
  } catch (dbError) {
    await supabase.storage.from('resumes').remove([storageKey])
    throw dbError
  }
}

export async function deleteResume(userId: string, resumeId: string): Promise<void> {
  const resume = await getResume(userId, resumeId)

  await prisma.resume.delete({ where: { id: resumeId } })

  const supabase = createAdminClient()
  await supabase.storage.from('resumes').remove([resume.id])

  if (resume.isPrimary) {
    const nextPrimary = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })
    if (nextPrimary) {
      await prisma.resume.update({ where: { id: nextPrimary.id }, data: { isPrimary: true } })
    }
  }

  await recordAudit(userId, 'resume_deleted', { resumeId })
}

export async function setPrimaryResume(userId: string, resumeId: string): Promise<ResumeDto> {
  await getResume(userId, resumeId)

  await prisma.$transaction(async (tx) => {
    await tx.resume.updateMany({ where: { userId }, data: { isPrimary: false } })
    await tx.resume.update({ where: { id: resumeId }, data: { isPrimary: true } })
  })

  return getResume(userId, resumeId)
}

export async function getDownloadUrl(
  userId: string,
  resumeId: string
): Promise<{ url: string; expiresInSeconds: number }> {
  const resume = await prisma.resume.findUnique({ where: { id: resumeId } })
  if (!resume || resume.userId !== userId) throw new Error('Resume not found.')

  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(resume.storageKey, DOWNLOAD_URL_TTL_SECONDS)

  if (error || !data) throw new Error(`Failed to generate download URL: ${error?.message}`)
  return { url: data.signedUrl, expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS }
}

export async function getParsedData(userId: string, resumeId: string): Promise<ResumeParsedDataDto> {
  const data = await prisma.resumeParsedData.findUnique({ where: { resumeId } })
  if (!data || data.userId !== userId) throw new Error('This resume has not finished parsing yet.')
  return data.structuredData as unknown as ResumeParsedDataDto
}

export async function updateParsedData(
  userId: string,
  resumeId: string,
  corrected: ResumeParsedData
): Promise<ResumeParsedDataDto> {
  const data = await prisma.resumeParsedData.findUnique({ where: { resumeId } })
  if (!data || data.userId !== userId) throw new Error('This resume has not finished parsing yet.')
  if (data.reviewStatus === 'confirmed') {
    throw new Error("This resume's parsed data has already been confirmed and applied to your profile.")
  }

  const updated = await prisma.resumeParsedData.update({
    where: { resumeId },
    data: { structuredData: corrected as object, updatedAt: new Date() },
  })

  return updated.structuredData as unknown as ResumeParsedDataDto
}

export async function confirmResume(userId: string, resumeId: string): Promise<void> {
  const data = await prisma.resumeParsedData.findUnique({ where: { resumeId } })
  if (!data || data.userId !== userId) throw new Error('This resume has not finished parsing yet.')
  if (data.reviewStatus === 'confirmed') return

  const parsed = resumeParsedDataSchema.parse(data.structuredData)
  await applyParsedResumeData(userId, parsed)

  await prisma.resumeParsedData.update({
    where: { resumeId },
    data: { reviewStatus: 'confirmed', confirmedAt: new Date(), updatedAt: new Date() },
  })

  await recordAudit(userId, 'resume_confirmed', { resumeId })
}

export async function reparseResume(userId: string, resumeId: string): Promise<void> {
  await getResume(userId, resumeId)
  void processResumeBackground(resumeId, userId)
}

function validateUpload(file: UploadFileInput): void {
  if (file.size > RESUME_MAX_FILE_SIZE_BYTES) {
    throw new Error(`File is too large (max ${RESUME_MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB).`)
  }
  if (!hasAllowedResumeExtension(file.filename)) {
    throw new Error('Only .pdf and .docx files are supported.')
  }
  if (!(RESUME_ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimeType)) {
    throw new Error('Only PDF and DOCX files are supported.')
  }
  const sniffed = sniffFileType(file.buffer)
  if (sniffed === 'unknown' || !mimeTypeMatchesSniffedType(file.mimeType, sniffed)) {
    throw new Error("This file doesn't look like a valid PDF or DOCX file. It may be corrupted or mislabeled.")
  }
}

type ResumeRow = Awaited<ReturnType<typeof prisma.resume.findUnique>>
type ParsedDataRow = Awaited<ReturnType<typeof prisma.resumeParsedData.findUnique>>

function toResumeDto(resume: NonNullable<ResumeRow>, parsedData: ParsedDataRow | null): ResumeDto {
  return {
    id: resume.id,
    versionLabel: resume.versionLabel,
    originalFilename: resume.originalFilename,
    mimeType: resume.mimeType,
    fileSizeBytes: resume.fileSizeBytes,
    isPrimary: resume.isPrimary,
    processingStatus: resume.processingStatus,
    processingError: resume.processingError,
    parsingJobStatus:
      resume.processingStatus === 'parsing'
        ? 'processing'
        : resume.processingStatus === 'parsed'
          ? 'completed'
          : null,
    reviewStatus: parsedData?.reviewStatus ?? null,
    createdAt: resume.createdAt.toISOString(),
  }
}
