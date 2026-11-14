import { prisma } from '@/lib/db/prisma'
import type {
  ApplicationStatus,
  JobDetailDto,
  JobDto,
  JobUserState,
} from '@/lib/types'
import { getProfile } from './profile'
import {
  analyzeJobIntelligence,
  computeJobMatch,
  extractJobSkills,
  inferSeniorityLevel,
  inferWorkMode,
  stripHtml,
} from './job-matching'

export interface BoardSource {
  provider: 'greenhouse' | 'lever'
  slug: string
  companyName: string
}

const DEFAULT_BOARDS: BoardSource[] = [
  { provider: 'greenhouse', slug: 'vercel', companyName: 'Vercel' },
  { provider: 'greenhouse', slug: 'anthropic', companyName: 'Anthropic' },
  { provider: 'greenhouse', slug: 'stripe', companyName: 'Stripe' },
  { provider: 'greenhouse', slug: 'figma', companyName: 'Figma' },
]

interface GreenhouseJob {
  id: number
  title: string
  absolute_url: string
  location?: { name?: string }
  content?: string
  updated_at?: string
}

interface LeverPosting {
  id: string
  text: string
  hostedUrl: string
  categories?: { location?: string; commitment?: string }
  descriptionPlain?: string
  description?: string
  createdAt?: number
}

export async function syncPublicJobs(
  customBoards?: BoardSource[]
): Promise<{ synced: number; boardsChecked: number }> {
  const boards =
    customBoards && customBoards.length > 0 ? customBoards : DEFAULT_BOARDS
  let totalSynced = 0

  for (const board of boards) {
    try {
      if (board.provider === 'greenhouse') {
        totalSynced += await ingestGreenhouseBoard(board.slug, board.companyName)
      } else if (board.provider === 'lever') {
        totalSynced += await ingestLeverBoard(board.slug, board.companyName)
      }
    } catch (error) {
      console.warn(`[Jobs Sync] Failed syncing ${board.provider}:${board.slug}`, error)
    }
  }

  return { synced: totalSynced, boardsChecked: boards.length }
}

interface JobUpsertInput {
  source: string
  externalId: string
  company: string
  title: string
  location: string | null
  workMode: string | null
  employmentType: string | null
  url: string
  description: string
  skills: string[]
  postedAt: Date | null
}

async function upsertJobBatch(rows: JobUpsertInput[]): Promise<number> {
  if (rows.length === 0) return 0
  const dedupedMap = new Map<string, JobUpsertInput>()
  for (const row of rows) {
    dedupedMap.set(`${row.source}:${row.externalId}`, row)
  }
  const deduped = [...dedupedMap.values()]

  for (const row of deduped) {
    await prisma.job.upsert({
      where: { jobs_source_external_id_idx: { source: row.source, externalId: row.externalId } },
      create: row,
      update: {
        title: row.title,
        location: row.location,
        workMode: row.workMode,
        url: row.url,
        description: row.description,
        skills: row.skills,
        postedAt: row.postedAt,
      },
    })
  }

  return deduped.length
}

async function ingestGreenhouseBoard(slug: string, companyName: string): Promise<number> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`
  const res = await fetch(url, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Greenhouse API returned ${res.status}`)

  const data = (await res.json()) as { jobs?: GreenhouseJob[] }
  const items = (data.jobs ?? []).slice(0, 20)
  const rows: JobUpsertInput[] = items.map((item) => {
    const cleanDescription = stripHtml(item.content ?? '')
    const location = item.location?.name ?? null
    const workMode = inferWorkMode(item.title, location, cleanDescription)
    const skills = extractJobSkills(item.title, cleanDescription)
    const postedAt = item.updated_at ? new Date(item.updated_at) : null
    return {
      source: 'greenhouse',
      externalId: `${slug}:${item.id}`,
      company: companyName,
      title: item.title,
      location,
      workMode,
      employmentType: 'full_time',
      url: item.absolute_url,
      description: cleanDescription.slice(0, 12000),
      skills,
      postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    }
  })

  return upsertJobBatch(rows)
}

async function ingestLeverBoard(slug: string, companyName: string): Promise<number> {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`
  const res = await fetch(url, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Lever API returned ${res.status}`)

  const items = ((await res.json()) as LeverPosting[]).slice(0, 20)
  const rows: JobUpsertInput[] = items.map((item) => {
    const cleanDescription = item.descriptionPlain ?? stripHtml(item.description ?? '')
    const location = item.categories?.location ?? null
    const workMode = inferWorkMode(item.text, location, cleanDescription)
    const skills = extractJobSkills(item.text, cleanDescription)
    const postedAt = item.createdAt ? new Date(item.createdAt) : null
    return {
      source: 'lever',
      externalId: `${slug}:${item.id}`,
      company: companyName,
      title: item.text,
      location,
      workMode,
      employmentType: item.categories?.commitment ?? 'full_time',
      url: item.hostedUrl,
      description: cleanDescription.slice(0, 12000),
      skills,
      postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    }
  })

  return upsertJobBatch(rows)
}

export type DiscoverJobsTab = 'for_you' | 'search' | 'adjacent' | 'saved'

export interface ListJobsOptions {
  tab?: DiscoverJobsTab
  q?: string
  workMode?: string
  minScore?: number
  freshness?: 'all' | '24h' | '7d' | '30d'
  seniority?: string
  includeDismissed?: boolean
  limit?: number
}

function matchesSeniorityFilter(jobTitle: string, description: string, filter: string): boolean {
  if (!filter || filter === 'all') return true
  const level = inferSeniorityLevel(jobTitle, description).toLowerCase()
  if (filter === 'junior') return level.includes('junior') || level.includes('entry')
  if (filter === 'mid') return level.includes('mid')
  if (filter === 'senior') return level.includes('senior')
  if (filter === 'staff') return level.includes('staff') || level.includes('lead')
  return true
}

let initialJobsSeedPromise: Promise<void> | null = null

async function ensureJobsSeededIfEmpty() {
  try {
    const total = await prisma.job.count()
    if (total > 0) return

    if (!initialJobsSeedPromise) {
      initialJobsSeedPromise = syncPublicJobs()
        .then(() => undefined)
        .catch((error) => {
          console.warn('[Jobs Seed] Initial public board sync skipped:', error)
        })
        .finally(() => {
          initialJobsSeedPromise = null
        })
    }
    await initialJobsSeedPromise
  } catch (error) {
    console.warn('[Jobs Seed] Failed checking job catalog count:', error)
  }
}

export async function listMatchedJobs(
  userId: string,
  options: ListJobsOptions = {}
): Promise<JobDto[]> {
  await ensureJobsSeededIfEmpty()
  const {
    tab,
    q,
    workMode,
    freshness = 'all',
    seniority = 'all',
    includeDismissed = false,
    limit = 100,
    minScore = 0,
  } = options

  const where: Record<string, unknown> = {}
  if (q?.trim()) {
    const term = q.trim()
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { company: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { location: { contains: term, mode: 'insensitive' } },
    ]
  }
  if (workMode && workMode !== 'all') {
    where.workMode = workMode
  }
  if (freshness && freshness !== 'all') {
    const hours = freshness === '24h' ? 24 : freshness === '7d' ? 24 * 7 : 24 * 30
    const cutoff = new Date(Date.now() - hours * 3600000)
    where.OR = [
      ...(Array.isArray(where.OR) ? where.OR : []),
      { postedAt: { gte: cutoff } },
      { createdAt: { gte: cutoff } },
    ]
  }

  const [jobRows, userProfile, userApps, userStates] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: [{ postedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    }),
    getProfile(userId),
    prisma.application.findMany({
      where: { userId },
      select: { id: true, jobId: true, status: true },
    }),
    prisma.userJobState.findMany({
      where: { userId },
      select: { jobId: true, state: true },
    }),
  ])

  const appByJobId = new Map<string, { id: string; status: ApplicationStatus }>()
  for (const app of userApps) {
    if (app.jobId) appByJobId.set(app.jobId, { id: app.id, status: app.status as ApplicationStatus })
  }

  const stateByJobId = new Map<string, 'saved' | 'dismissed'>()
  for (const row of userStates) {
    stateByJobId.set(row.jobId, row.state as 'saved' | 'dismissed')
  }

  const excludedCompanies = new Set(
    (userProfile?.excludedCompanies ?? []).map((c) => c.trim().toLowerCase()).filter(Boolean)
  )

  let mapped: JobDto[] = jobRows.map((job) => {
    const match = computeJobMatch(userProfile, job)
    const existingApp = appByJobId.get(job.id)
    const userState: JobUserState = stateByJobId.get(job.id) ?? null
    return {
      id: job.id,
      source: job.source,
      externalId: job.externalId,
      company: job.company,
      title: job.title,
      location: job.location,
      workMode: job.workMode,
      employmentType: job.employmentType,
      url: job.url,
      description: job.description,
      skills: job.skills,
      postedAt: job.postedAt ? job.postedAt.toISOString() : null,
      createdAt: job.createdAt.toISOString(),
      match,
      userState,
      applicationId: existingApp?.id ?? null,
      applicationStatus: existingApp?.status ?? null,
    }
  })

  if (!includeDismissed) {
    mapped = mapped.filter((j) => j.userState !== 'dismissed')
  }
  if (tab === 'for_you' || tab === 'adjacent') {
    mapped = mapped.filter((j) => !excludedCompanies.has(j.company.toLowerCase()))
  }
  if (tab === 'adjacent') {
    mapped = mapped.filter((j) => j.match.isAdjacentRole)
  } else if (tab === 'saved') {
    mapped = mapped.filter(
      (j) => j.userState === 'saved' || j.applicationStatus === 'saved'
    )
  }
  if (minScore > 0) {
    mapped = mapped.filter((j) => j.match.score >= minScore)
  }
  if (seniority && seniority !== 'all') {
    mapped = mapped.filter((j) => matchesSeniorityFilter(j.title, j.description, seniority))
  }

  mapped.sort((a, b) => b.match.score - a.match.score)
  return mapped
}

export async function getJobDetail(
  userId: string,
  jobId: string
): Promise<JobDetailDto | null> {
  const jobRow = await prisma.job.findUnique({ where: { id: jobId } })
  if (!jobRow) return null

  const [userProfile, appRows, stateRows, tailoredCount] = await Promise.all([
    getProfile(userId),
    prisma.application.findMany({
      where: { userId, jobId },
      select: { id: true, status: true },
      take: 1,
    }),
    prisma.userJobState.findMany({
      where: { userId, jobId },
      select: { state: true },
      take: 1,
    }),
    prisma.tailoredDocument.count({ where: { userId, jobId } }),
  ])

  const match = computeJobMatch(userProfile, jobRow)
  const intelligence = analyzeJobIntelligence(jobRow)
  const existingApp = appRows[0]

  return {
    id: jobRow.id,
    source: jobRow.source,
    externalId: jobRow.externalId,
    company: jobRow.company,
    title: jobRow.title,
    location: jobRow.location,
    workMode: jobRow.workMode,
    employmentType: jobRow.employmentType,
    url: jobRow.url,
    description: jobRow.description,
    skills: jobRow.skills,
    postedAt: jobRow.postedAt ? jobRow.postedAt.toISOString() : null,
    createdAt: jobRow.createdAt.toISOString(),
    match,
    userState: (stateRows[0]?.state as 'saved' | 'dismissed') ?? null,
    applicationId: existingApp?.id ?? null,
    applicationStatus: existingApp?.status as ApplicationStatus ?? null,
    intelligence,
    tailoredDocumentsCount: tailoredCount,
  }
}

export async function setJobState(
  userId: string,
  jobId: string,
  state: 'saved' | 'dismissed'
): Promise<{
  userState: 'saved' | 'dismissed'
  applicationId: string | null
  applicationStatus: ApplicationStatus | null
} | null> {
  const jobRow = await prisma.job.findUnique({ where: { id: jobId } })
  if (!jobRow) return null

  await prisma.userJobState.upsert({
    where: { job_states_user_job_idx: { userId, jobId } },
    create: { userId, jobId, state },
    update: { state, updatedAt: new Date() },
  })

  const existingApp = await prisma.application.findFirst({
    where: { userId, jobId },
    select: { id: true, status: true },
  })

  if (state === 'saved' && !existingApp) {
    const profile = await getProfile(userId)
    const match = computeJobMatch(profile, jobRow)
    const createdApp = await prisma.application.create({
      data: {
        userId,
        jobId: jobRow.id,
        company: jobRow.company,
        title: jobRow.title,
        location: jobRow.location,
        url: jobRow.url,
        status: 'saved',
        matchScore: match.score,
      },
    })

    await prisma.applicationEvent.create({
      data: {
        applicationId: createdApp.id,
        userId,
        type: 'created',
        description: 'Saved from Discover Jobs',
      },
    })

    return {
      userState: state,
      applicationId: createdApp.id,
      applicationStatus: 'saved',
    }
  }

  return {
    userState: state,
    applicationId: existingApp?.id ?? null,
    applicationStatus: (existingApp?.status as ApplicationStatus) ?? null,
  }
}

export async function clearJobState(userId: string, jobId: string): Promise<boolean> {
  const deleted = await prisma.userJobState.deleteMany({ where: { userId, jobId } })
  return deleted.count > 0
}
