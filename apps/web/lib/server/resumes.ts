import { createHash, randomUUID } from 'node:crypto';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { resumes, resumeParsedData } from '@/lib/db/schema';
import type { ResumeDto, ResumeParsedDataDto } from '@/lib/types';
import {
  hasAllowedResumeExtension,
  RESUME_ALLOWED_MIME_TYPES,
  RESUME_MAX_FILE_SIZE_BYTES,
  resumeParsedDataSchema,
  type ResumeParsedData,
} from '@applypilot/validators';
import { createAdminClient } from '@/lib/supabase/admin';
import { sniffFileType, mimeTypeMatchesSniffedType } from './file-signature';
import { recordAudit } from './audit';
import { applyParsedResumeData } from './profile';
import { processResumeBackground } from './resume-parsing';

const DOWNLOAD_URL_TTL_SECONDS = 300;

export interface UploadFileInput {
  filename: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export async function listResumes(userId: string): Promise<ResumeDto[]> {
  const rows = await db
    .select({
      resume: resumes,
      parsedData: resumeParsedData,
    })
    .from(resumes)
    .leftJoin(resumeParsedData, eq(resumes.id, resumeParsedData.resumeId))
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.createdAt));

  return rows.map(({ resume, parsedData }) => toResumeDto(resume, parsedData));
}

export async function getResume(
  userId: string,
  resumeId: string
): Promise<ResumeDto> {
  const [row] = await db
    .select({
      resume: resumes,
      parsedData: resumeParsedData,
    })
    .from(resumes)
    .leftJoin(resumeParsedData, eq(resumes.id, resumeParsedData.resumeId))
    .where(eq(resumes.id, resumeId))
    .limit(1);

  if (!row || row.resume.userId !== userId) {
    throw new Error('Resume not found.');
  }

  return toResumeDto(row.resume, row.parsedData);
}

export async function uploadResume(
  userId: string,
  file: UploadFileInput,
  versionLabel?: string
): Promise<ResumeDto> {
  validateUpload(file);

  const checksum = createHash('sha256').update(file.buffer).digest('hex');
  const resumeId = randomUUID();
  const ext = file.filename.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf';
  const storageKey = `${userId}/${resumeId}.${ext}`;

  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(storageKey, file.buffer, {
      contentType: file.mimeType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to store resume file: ${uploadError.message}`);
  }

  const existingResumes = await db
    .select({ id: resumes.id })
    .from(resumes)
    .where(eq(resumes.userId, userId));

  const isPrimary = existingResumes.length === 0;

  try {
    const [inserted] = await db
      .insert(resumes)
      .values({
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
      })
      .returning();

    if (!inserted) {
      throw new Error('Failed to insert resume record.');
    }

    await recordAudit(userId, 'resume_uploaded', { resumeId });

    return toResumeDto(inserted, null);
  } catch (dbError) {
    // Compensation: delete file from storage if DB insert fails
    await supabase.storage.from('resumes').remove([storageKey]);
    throw dbError;
  }
}

export async function deleteResume(
  userId: string,
  resumeId: string
): Promise<void> {
  const resume = await getResume(userId, resumeId);

  await db.delete(resumes).where(eq(resumes.id, resumeId));

  const supabase = createAdminClient();
  await supabase.storage.from('resumes').remove([resume.id]);

  if (resume.isPrimary) {
    const [nextPrimary] = await db
      .select({ id: resumes.id })
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .orderBy(desc(resumes.createdAt))
      .limit(1);

    if (nextPrimary) {
      await db
        .update(resumes)
        .set({ isPrimary: true })
        .where(eq(resumes.id, nextPrimary.id));
    }
  }

  await recordAudit(userId, 'resume_deleted', { resumeId });
}

export async function setPrimaryResume(
  userId: string,
  resumeId: string
): Promise<ResumeDto> {
  await getResume(userId, resumeId);

  await db.transaction(async (tx) => {
    await tx
      .update(resumes)
      .set({ isPrimary: false })
      .where(eq(resumes.userId, userId));
    await tx
      .update(resumes)
      .set({ isPrimary: true })
      .where(eq(resumes.id, resumeId));
  });

  return getResume(userId, resumeId);
}

export async function getDownloadUrl(
  userId: string,
  resumeId: string
): Promise<{ url: string; expiresInSeconds: number }> {
  const [resume] = await db
    .select()
    .from(resumes)
    .where(eq(resumes.id, resumeId))
    .limit(1);

  if (!resume || resume.userId !== userId) {
    throw new Error('Resume not found.');
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(resume.storageKey, DOWNLOAD_URL_TTL_SECONDS);

  if (error || !data) {
    throw new Error(`Failed to generate download URL: ${error?.message}`);
  }

  return { url: data.signedUrl, expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS };
}

export async function getParsedData(
  userId: string,
  resumeId: string
): Promise<ResumeParsedDataDto> {
  const [data] = await db
    .select()
    .from(resumeParsedData)
    .where(eq(resumeParsedData.resumeId, resumeId))
    .limit(1);

  if (!data || data.userId !== userId) {
    throw new Error('This resume has not finished parsing yet.');
  }

  return data.structuredData as unknown as ResumeParsedDataDto;
}

export async function updateParsedData(
  userId: string,
  resumeId: string,
  corrected: ResumeParsedData
): Promise<ResumeParsedDataDto> {
  const [data] = await db
    .select()
    .from(resumeParsedData)
    .where(eq(resumeParsedData.resumeId, resumeId))
    .limit(1);

  if (!data || data.userId !== userId) {
    throw new Error('This resume has not finished parsing yet.');
  }

  const [updated] = await db
    .update(resumeParsedData)
    .set({
      structuredData: corrected,
      reviewStatus: data.reviewStatus === 'confirmed' ? 'pending_review' : data.reviewStatus,
      updatedAt: new Date(),
    })
    .where(eq(resumeParsedData.resumeId, resumeId))
    .returning();

  if (!updated) {
    throw new Error('Failed to update resume parsed data.');
  }

  return updated.structuredData as unknown as ResumeParsedDataDto;
}

export async function confirmResume(
  userId: string,
  resumeId: string
): Promise<void> {
  const [data] = await db
    .select()
    .from(resumeParsedData)
    .where(eq(resumeParsedData.resumeId, resumeId))
    .limit(1);

  if (!data || data.userId !== userId) {
    throw new Error('This resume has not finished parsing yet.');
  }

  if (data.reviewStatus === 'confirmed') {
    return;
  }

  const parsed = resumeParsedDataSchema.parse(data.structuredData);
  await applyParsedResumeData(userId, parsed);

  await db
    .update(resumeParsedData)
    .set({
      reviewStatus: 'confirmed',
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(resumeParsedData.resumeId, resumeId));

  await recordAudit(userId, 'resume_confirmed', { resumeId });
}

export async function reparseResume(
  userId: string,
  resumeId: string
): Promise<void> {
  await getResume(userId, resumeId);
  void processResumeBackground(resumeId, userId);
}

function validateUpload(file: UploadFileInput): void {
  if (file.size > RESUME_MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File is too large (max ${RESUME_MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB).`
    );
  }
  if (!hasAllowedResumeExtension(file.filename)) {
    throw new Error('Only .pdf and .docx files are supported.');
  }
  if (!(RESUME_ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimeType)) {
    throw new Error('Only PDF and DOCX files are supported.');
  }
  const sniffed = sniffFileType(file.buffer);
  if (
    sniffed === 'unknown' ||
    !mimeTypeMatchesSniffedType(file.mimeType, sniffed)
  ) {
    throw new Error(
      "This file doesn't look like a valid PDF or DOCX file. It may be corrupted or mislabeled."
    );
  }
}

function toResumeDto(
  resume: typeof resumes.$inferSelect,
  parsedData: typeof resumeParsedData.$inferSelect | null
): ResumeDto {
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
  };
}
