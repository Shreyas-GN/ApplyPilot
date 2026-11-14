import { prisma } from '@/lib/db/prisma'
import type {
  ApplicationChecklistState,
  ApplicationDto,
  ApplicationEventDto,
  ApplicationReadiness,
  ApplicationStatus,
} from '@/lib/types'
import { recordAudit } from './audit'
import { getProfile } from './profile'

export interface CreateApplicationInput {
  jobId?: string
  company: string
  title: string
  location?: string | null
  url?: string | null
  status?: ApplicationStatus
  matchScore?: number | null
  notes?: string | null
  followUpAt?: string | null
}

export interface UpdateApplicationInput {
  status?: ApplicationStatus
  notes?: string | null
  followUpAt?: string | null
  checklist?: ApplicationChecklistState
}

function normalizeChecklist(raw: unknown): ApplicationChecklistState {
  if (!raw || typeof raw !== 'object') return {}
  const obj = raw as Record<string, unknown>
  return {
    screeningPrepared: Boolean(obj.screeningPrepared),
    finalReviewed: Boolean(obj.finalReviewed),
  }
}

function buildReadiness(params: {
  profileComplete: boolean
  hasResume: boolean
  tailoredResume: boolean
  coverLetter: boolean
  checklist: ApplicationChecklistState
}): ApplicationReadiness {
  const screeningPrepared = Boolean(params.checklist.screeningPrepared)
  const finalReviewed = Boolean(params.checklist.finalReviewed)
  const checks = [
    params.profileComplete,
    params.hasResume,
    params.tailoredResume,
    params.coverLetter,
    screeningPrepared,
    finalReviewed,
  ]
  return {
    profileComplete: params.profileComplete,
    hasResume: params.hasResume,
    tailoredResume: params.tailoredResume,
    coverLetter: params.coverLetter,
    screeningPrepared,
    finalReviewed,
    completedCount: checks.filter(Boolean).length,
    totalCount: checks.length,
  }
}

async function loadReadinessContext(userId: string) {
  const [profile, resumeRows, docRows] = await Promise.all([
    getProfile(userId),
    prisma.resume.findMany({ where: { userId }, select: { id: true }, take: 1 }),
    prisma.tailoredDocument.findMany({
      where: { userId },
      select: { applicationId: true, jobId: true, type: true },
    }),
  ])
  const profileComplete = profile.completionPercent >= 70
  const hasResume = resumeRows.length > 0
  return { profileComplete, hasResume, docRows }
}

export async function listApplications(userId: string): Promise<ApplicationDto[]> {
  const rows = await prisma.application.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })

  if (rows.length === 0) return []

  const readinessCtx = await loadReadinessContext(userId)
  const appIds = rows.map((r) => r.id)
  const events = await prisma.applicationEvent.findMany({
    where: { userId, applicationId: { in: appIds } },
    orderBy: { createdAt: 'desc' },
  })

  const eventsByApp = new Map<string, ApplicationEventDto[]>()
  for (const ev of events) {
    const list = eventsByApp.get(ev.applicationId) ?? []
    list.push({ id: ev.id, type: ev.type, description: ev.description, createdAt: ev.createdAt.toISOString() })
    eventsByApp.set(ev.applicationId, list)
  }

  return rows.map((row) => toApplicationDto(row, eventsByApp.get(row.id) ?? [], readinessCtx))
}

export async function createApplication(
  userId: string,
  input: CreateApplicationInput
): Promise<ApplicationDto> {
  if (input.jobId) {
    const existing = await prisma.application.findFirst({
      where: { userId, jobId: input.jobId },
    })
    if (existing) {
      const ctx = await loadReadinessContext(userId)
      return toApplicationDto(existing, [], ctx)
    }

    const jobExists = await prisma.job.findUnique({
      where: { id: input.jobId },
      select: { id: true },
    })
    if (!jobExists) throw new Error('Job not found.')
  }

  const initialStatus: ApplicationStatus = input.status ?? 'saved'
  const appliedAt = initialStatus === 'applied' ? new Date() : null
  const followUpAt = input.followUpAt ? new Date(input.followUpAt) : null

  const created = await prisma.$transaction(async (tx) => {
    const app = await tx.application.create({
      data: {
        userId,
        jobId: input.jobId ?? null,
        company: input.company.trim(),
        title: input.title.trim(),
        location: input.location?.trim() || null,
        url: input.url?.trim() || null,
        status: initialStatus,
        matchScore: input.matchScore ?? null,
        notes: input.notes?.trim() || null,
        followUpAt: followUpAt && !Number.isNaN(followUpAt.getTime()) ? followUpAt : null,
        appliedAt,
      },
    })
    await tx.applicationEvent.create({
      data: {
        applicationId: app.id,
        userId,
        type: 'created',
        description: `Added to tracker as "${initialStatus}"`,
      },
    })
    return app
  })

  await recordAudit(userId, 'application_created', {
    applicationId: created.id,
    company: created.company,
    status: created.status,
  })

  const ctx = await loadReadinessContext(userId)
  return toApplicationDto(
    created,
    [{ id: 'initial', type: 'created', description: `Added to tracker as "${initialStatus}"`, createdAt: created.createdAt.toISOString() }],
    ctx
  )
}

export async function updateApplication(
  userId: string,
  appId: string,
  input: UpdateApplicationInput
): Promise<ApplicationDto> {
  const existing = await prisma.application.findFirst({ where: { id: appId, userId } })
  if (!existing) throw new Error('Application not found.')

  const nextStatus = input.status ?? existing.status
  const statusChanged = input.status !== undefined && input.status !== existing.status
  const notesChanged = input.notes !== undefined && input.notes !== existing.notes
  const followUpChanged = input.followUpAt !== undefined

  const updateData: Parameters<typeof prisma.application.update>[0]['data'] = {
    updatedAt: new Date(),
  }

  if (input.status !== undefined) {
    updateData.status = input.status
    if (input.status === 'applied' && !existing.appliedAt) {
      updateData.appliedAt = new Date()
    }
  }
  if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null
  if (input.followUpAt !== undefined) {
    if (!input.followUpAt) {
      updateData.followUpAt = null
    } else {
      const parsedDate = new Date(input.followUpAt)
      if (Number.isNaN(parsedDate.getTime())) throw new Error('Invalid follow-up date.')
      updateData.followUpAt = parsedDate
    }
  }
  if (input.checklist !== undefined) {
    updateData.checklist = { ...normalizeChecklist(existing.checklist), ...input.checklist }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.application.update({ where: { id: appId }, data: updateData })

    if (statusChanged) {
      await tx.applicationEvent.create({
        data: { applicationId: appId, userId, type: 'status_change', description: `Moved from "${existing.status}" to "${nextStatus}"` },
      })
    } else if (followUpChanged) {
      await tx.applicationEvent.create({
        data: {
          applicationId: appId,
          userId,
          type: 'follow_up',
          description: row.followUpAt
            ? `Scheduled follow-up for ${row.followUpAt.toLocaleDateString()}`
            : 'Cleared follow-up reminder',
        },
      })
    } else if (notesChanged) {
      await tx.applicationEvent.create({
        data: { applicationId: appId, userId, type: 'note', description: 'Updated application notes' },
      })
    }

    return row
  })

  const [events, ctx] = await Promise.all([
    prisma.applicationEvent.findMany({ where: { applicationId: appId }, orderBy: { createdAt: 'desc' } }),
    loadReadinessContext(userId),
  ])

  return toApplicationDto(
    updated,
    events.map((e) => ({ id: e.id, type: e.type, description: e.description, createdAt: e.createdAt.toISOString() })),
    ctx
  )
}

export async function deleteApplication(userId: string, appId: string): Promise<void> {
  const deleted = await prisma.application.deleteMany({ where: { id: appId, userId } })
  if (deleted.count === 0) throw new Error('Application not found.')
  await recordAudit(userId, 'application_deleted', { applicationId: appId })
}

function toApplicationDto(
  row: Awaited<ReturnType<typeof prisma.application.findFirst>> & object,
  events: ApplicationEventDto[],
  ctx: {
    profileComplete: boolean
    hasResume: boolean
    docRows: Array<{ applicationId: string | null; jobId: string | null; type: string }>
  }
): ApplicationDto {
  const checklist = normalizeChecklist(row.checklist)
  const matchingDocs = ctx.docRows.filter(
    (d) => d.applicationId === row.id || (row.jobId !== null && d.jobId === row.jobId)
  )
  const tailoredResume = matchingDocs.some((d) => d.type === 'resume')
  const coverLetter = matchingDocs.some((d) => d.type === 'cover_letter')

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
    checklist,
    readiness: buildReadiness({ profileComplete: ctx.profileComplete, hasResume: ctx.hasResume, tailoredResume, coverLetter, checklist }),
    appliedAt: row.appliedAt ? row.appliedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    events,
  }
}
