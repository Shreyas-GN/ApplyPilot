import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '@/lib/db/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  ApplicationDto,
  ApplicationStatus,
  ExtensionSessionDto,
  ProfileDto,
} from '@/lib/types'
import { recordAudit } from './audit'
import { getProfile } from './profile'

export interface ExtensionAutofillPayload {
  profile: {
    fullName: string | null
    email: string | null
    phone: string | null
    location: string | null
    linkedinUrl: string | null
    githubUrl: string | null
    portfolioUrl: string | null
    headline: string | null
    summary: string | null
  }
  primaryResume: {
    id: string
    filename: string
    downloadUrl: string | null
  } | null
}

export interface CaptureExtensionApplicationInput {
  company: string
  title: string
  location?: string | null
  url: string
  ats?: string
  status?: ApplicationStatus
  filledFields?: string[]
}

export function hashExtensionToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

export function extractBearerToken(
  authHeader: string | null | undefined
): string | null {
  if (!authHeader) return null
  const match = authHeader.trim().match(/^Bearer\s+(.+)$/i)
  return match && match[1] ? match[1].trim() : null
}

function toExtensionSessionDto(
  row: Awaited<ReturnType<typeof prisma.extensionSession.create>>
): ExtensionSessionDto {
  return {
    id: row.id,
    label: row.label,
    lastUsedAt: row.lastUsedAt ? row.lastUsedAt.toISOString() : null,
    revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function createPairingToken(
  userId: string,
  label = 'Chrome Extension'
): Promise<{ session: ExtensionSessionDto; token: string }> {
  const token = `ap_ext_${randomBytes(24).toString('hex')}`
  const tokenHash = hashExtensionToken(token)

  const created = await prisma.extensionSession.create({
    data: {
      userId,
      label: label.trim() || 'Chrome Extension',
      tokenHash,
    },
  })

  await recordAudit(userId, 'extension_paired', {
    sessionId: created.id,
    label: created.label,
  })

  return {
    session: toExtensionSessionDto(created),
    token,
  }
}

export async function listExtensionSessions(
  userId: string
): Promise<ExtensionSessionDto[]> {
  const rows = await prisma.extensionSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return rows.map(toExtensionSessionDto)
}

export async function revokeExtensionSession(
  userId: string,
  sessionId: string
): Promise<boolean> {
  const result = await prisma.extensionSession.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })

  if (result.count > 0) {
    await recordAudit(userId, 'extension_revoked', { sessionId })
    return true
  }
  return false
}

export async function verifyExtensionBearer(
  authHeader: string | null | undefined
): Promise<{ userId: string; sessionId: string } | null> {
  const token = extractBearerToken(authHeader)
  if (!token || !token.startsWith('ap_ext_')) {
    return null
  }

  const tokenHash = hashExtensionToken(token)
  const session = await prisma.extensionSession.findFirst({
    where: { tokenHash, revokedAt: null },
  })

  if (!session) return null

  await prisma.extensionSession.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  })

  return { userId: session.userId, sessionId: session.id }
}

export async function getExtensionAutofillPayload(
  userId: string,
  userEmail: string | null
): Promise<ExtensionAutofillPayload> {
  const profile: ProfileDto = await getProfile(userId)

  const primary = await prisma.resume.findFirst({
    where: { userId, isPrimary: true },
  })

  let downloadUrl: string | null = null
  if (primary?.storageKey) {
    try {
      const supabase = createAdminClient()
      const { data } = await supabase.storage
        .from('resumes')
        .createSignedUrl(primary.storageKey, 300)
      downloadUrl = data?.signedUrl ?? null
    } catch {
      downloadUrl = null
    }
  }

  return {
    profile: {
      fullName: profile.fullName,
      email: userEmail,
      phone: profile.phone,
      location: profile.location,
      linkedinUrl: profile.linkedinUrl,
      githubUrl: profile.githubUrl,
      portfolioUrl: profile.portfolioUrl,
      headline: profile.headline,
      summary: profile.summary,
    },
    primaryResume: primary
      ? {
          id: primary.id,
          filename: primary.originalFilename,
          downloadUrl,
        }
      : null,
  }
}

export async function captureApplicationFromExtension(
  userId: string,
  input: CaptureExtensionApplicationInput
): Promise<ApplicationDto> {
  const nextStatus: ApplicationStatus = input.status ?? 'saved'
  const filledFields = input.filledFields ?? []
  const atsLabel = input.ats ? ` (${input.ats})` : ''

  const existing = await prisma.application.findFirst({
    where: { userId, url: input.url },
  })

  if (existing) {
    const shouldAdvanceStatus =
      nextStatus === 'applied' && existing.status === 'saved'

    const row = await prisma.application.update({
      where: { id: existing.id },
      data: {
        status: shouldAdvanceStatus ? 'applied' : existing.status,
        appliedAt:
          shouldAdvanceStatus && !existing.appliedAt ? new Date() : existing.appliedAt,
        updatedAt: new Date(),
      },
    })

    if (filledFields.length > 0) {
      await prisma.applicationEvent.create({
        data: {
          applicationId: row.id,
          userId,
          type: 'extension_autofill',
          description: `Extension Co-pilot filled ${filledFields.join(', ')}${atsLabel}`,
        },
      })
    } else if (shouldAdvanceStatus) {
      await prisma.applicationEvent.create({
        data: {
          applicationId: row.id,
          userId,
          type: 'status_change',
          description: `Marked applied from Chrome Extension${atsLabel}`,
        },
      })
    }

    await recordAudit(userId, 'extension_activity', {
      applicationId: row.id,
      ats: input.ats ?? 'unknown',
      filledFields,
      status: row.status,
    })

    return toExtensionApplicationDto(row)
  }

  const created = await prisma.application.create({
    data: {
      userId,
      company: input.company.trim(),
      title: input.title.trim(),
      location: input.location?.trim() || null,
      url: input.url.trim(),
      status: nextStatus,
      appliedAt: nextStatus === 'applied' ? new Date() : null,
    },
  })

  await prisma.applicationEvent.create({
    data: {
      applicationId: created.id,
      userId,
      type: filledFields.length > 0 ? 'extension_autofill' : 'created',
      description:
        filledFields.length > 0
          ? `Captured via Chrome Extension${atsLabel} and autofilled: ${filledFields.join(', ')}`
          : `Saved from Chrome Extension${atsLabel}`,
    },
  })

  await recordAudit(userId, 'extension_activity', {
    applicationId: created.id,
    ats: input.ats ?? 'unknown',
    filledFields,
    status: created.status,
  })

  return toExtensionApplicationDto(created)
}

function toExtensionApplicationDto(
  row: Awaited<ReturnType<typeof prisma.application.create>>
): ApplicationDto {
  return {
    id: row.id,
    jobId: row.jobId,
    company: row.company,
    title: row.title,
    location: row.location,
    url: row.url,
    status: row.status as ApplicationStatus,
    matchScore: row.matchScore,
    notes: row.notes,
    followUpAt: row.followUpAt ? row.followUpAt.toISOString() : null,
    checklist:
      row.checklist && typeof row.checklist === 'object'
        ? (row.checklist as ApplicationDto['checklist'])
        : {},
    appliedAt: row.appliedAt ? row.appliedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
