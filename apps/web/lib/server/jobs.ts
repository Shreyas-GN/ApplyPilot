import { desc, eq, ilike, or, and, gte, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  applicationEvents,
  applications,
  jobs,
  jobStates,
  tailoredDocuments,
} from '@/lib/db/schema';
import type {
  ApplicationStatus,
  JobDetailDto,
  JobDto,
  JobUserState,
} from '@/lib/types';
import { getProfile } from './profile';
import {
  analyzeJobIntelligence,
  computeJobMatch,
  extractJobSkills,
  inferSeniorityLevel,
  inferWorkMode,
  stripHtml,
} from './job-matching';

export interface BoardSource {
  provider: 'greenhouse' | 'lever';
  slug: string;
  companyName: string;
}

const DEFAULT_BOARDS: BoardSource[] = [
  { provider: 'greenhouse', slug: 'vercel', companyName: 'Vercel' },
  { provider: 'greenhouse', slug: 'anthropic', companyName: 'Anthropic' },
  { provider: 'greenhouse', slug: 'stripe', companyName: 'Stripe' },
  { provider: 'greenhouse', slug: 'figma', companyName: 'Figma' },
];

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  location?: { name?: string };
  content?: string;
  updated_at?: string;
}

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  categories?: {
    location?: string;
    commitment?: string;
  };
  descriptionPlain?: string;
  description?: string;
  createdAt?: number;
}

export async function syncPublicJobs(
  customBoards?: BoardSource[]
): Promise<{ synced: number; boardsChecked: number }> {
  const boards = customBoards && customBoards.length > 0 ? customBoards : DEFAULT_BOARDS;
  let totalSynced = 0;

  for (const board of boards) {
    try {
      if (board.provider === 'greenhouse') {
        const count = await ingestGreenhouseBoard(board.slug, board.companyName);
        totalSynced += count;
      } else if (board.provider === 'lever') {
        const count = await ingestLeverBoard(board.slug, board.companyName);
        totalSynced += count;
      }
    } catch (error) {
      console.warn(
        `[Jobs Sync] Failed syncing ${board.provider}:${board.slug}`,
        error
      );
    }
  }

  return { synced: totalSynced, boardsChecked: boards.length };
}

async function ingestGreenhouseBoard(
  slug: string,
  companyName: string
): Promise<number> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Greenhouse API returned ${res.status}`);
  }

  const data = (await res.json()) as { jobs?: GreenhouseJob[] };
  const items = (data.jobs ?? []).slice(0, 20);
  let count = 0;

  for (const item of items) {
    const cleanDescription = stripHtml(item.content ?? '');
    const location = item.location?.name ?? null;
    const workMode = inferWorkMode(item.title, location, cleanDescription);
    const skills = extractJobSkills(item.title, cleanDescription);
    const postedAt = item.updated_at ? new Date(item.updated_at) : null;

    await db
      .insert(jobs)
      .values({
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
      })
      .onConflictDoUpdate({
        target: [jobs.source, jobs.externalId],
        set: {
          title: item.title,
          location,
          workMode,
          url: item.absolute_url,
          description: cleanDescription.slice(0, 12000),
          skills,
          postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
        },
      });
    count++;
  }

  return count;
}

async function ingestLeverBoard(
  slug: string,
  companyName: string
): Promise<number> {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Lever API returned ${res.status}`);
  }

  const items = ((await res.json()) as LeverPosting[]).slice(0, 20);
  let count = 0;

  for (const item of items) {
    const cleanDescription =
      item.descriptionPlain ?? stripHtml(item.description ?? '');
    const location = item.categories?.location ?? null;
    const workMode = inferWorkMode(item.text, location, cleanDescription);
    const skills = extractJobSkills(item.text, cleanDescription);
    const postedAt = item.createdAt ? new Date(item.createdAt) : null;

    await db
      .insert(jobs)
      .values({
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
      })
      .onConflictDoUpdate({
        target: [jobs.source, jobs.externalId],
        set: {
          title: item.text,
          location,
          workMode,
          url: item.hostedUrl,
          description: cleanDescription.slice(0, 12000),
          skills,
          postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
        },
      });
    count++;
  }

  return count;
}

export type DiscoverJobsTab = 'for_you' | 'search' | 'adjacent' | 'saved';

export interface ListJobsOptions {
  tab?: DiscoverJobsTab;
  q?: string;
  workMode?: string;
  minScore?: number;
  freshness?: 'all' | '24h' | '7d' | '30d';
  seniority?: string;
  includeDismissed?: boolean;
  limit?: number;
}

function matchesSeniorityFilter(jobTitle: string, description: string, filter: string): boolean {
  if (!filter || filter === 'all') return true;
  const level = inferSeniorityLevel(jobTitle, description).toLowerCase();
  if (filter === 'junior') return level.includes('junior') || level.includes('entry');
  if (filter === 'mid') return level.includes('mid');
  if (filter === 'senior') return level.includes('senior');
  if (filter === 'staff') return level.includes('staff') || level.includes('lead');
  return true;
}

export async function listMatchedJobs(
  userId: string,
  options: ListJobsOptions = {}
): Promise<JobDto[]> {
  const {
    tab,
    q,
    workMode,
    minScore = 0,
    freshness = 'all',
    seniority = 'all',
    includeDismissed = false,
    limit = 100,
  } = options;

  const conditions = [];
  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    conditions.push(
      or(
        ilike(jobs.title, term),
        ilike(jobs.company, term),
        ilike(jobs.description, term),
        ilike(jobs.location, term)
      )
    );
  }
  if (workMode && workMode !== 'all') {
    conditions.push(eq(jobs.workMode, workMode));
  }
  if (freshness && freshness !== 'all') {
    const now = Date.now();
    const hours = freshness === '24h' ? 24 : freshness === '7d' ? 24 * 7 : 24 * 30;
    const cutoff = new Date(now - hours * 60 * 60 * 1000);
    conditions.push(or(gte(jobs.postedAt, cutoff), gte(jobs.createdAt, cutoff)));
  }

  const [jobRows, userProfile, userApps, userStates] = await Promise.all([
    db
      .select()
      .from(jobs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(jobs.postedAt), desc(jobs.createdAt))
      .limit(limit),
    getProfile(userId),
    db
      .select({
        id: applications.id,
        jobId: applications.jobId,
        status: applications.status,
      })
      .from(applications)
      .where(eq(applications.userId, userId)),
    db
      .select({
        jobId: jobStates.jobId,
        state: jobStates.state,
      })
      .from(jobStates)
      .where(eq(jobStates.userId, userId)),
  ]);

  const appByJobId = new Map<string, { id: string; status: ApplicationStatus }>();
  for (const app of userApps) {
    if (app.jobId) {
      appByJobId.set(app.jobId, { id: app.id, status: app.status });
    }
  }

  const stateByJobId = new Map<string, 'saved' | 'dismissed'>();
  for (const row of userStates) {
    stateByJobId.set(row.jobId, row.state);
  }

  const excludedCompanies = new Set(
    (userProfile?.excludedCompanies ?? []).map((c) => c.trim().toLowerCase()).filter(Boolean)
  );

  let mapped: JobDto[] = jobRows.map((job) => {
    const match = computeJobMatch(userProfile, job);
    const existingApp = appByJobId.get(job.id);
    const userState: JobUserState = stateByJobId.get(job.id) ?? null;
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
    };
  });

  if (!includeDismissed) {
    mapped = mapped.filter((j) => j.userState !== 'dismissed');
  }

  if (tab === 'for_you' || tab === 'adjacent') {
    mapped = mapped.filter((j) => !excludedCompanies.has(j.company.toLowerCase()));
  }

  if (tab === 'adjacent') {
    mapped = mapped.filter((j) => j.match.isAdjacentRole);
  } else if (tab === 'saved') {
    mapped = mapped.filter(
      (j) => j.userState === 'saved' || j.applicationStatus === 'saved'
    );
  }

  if (minScore > 0) {
    mapped = mapped.filter((j) => j.match.score >= minScore);
  }

  if (seniority && seniority !== 'all') {
    mapped = mapped.filter((j) => matchesSeniorityFilter(j.title, j.description, seniority));
  }

  // Sort highest match first (tie-breaking by recency)
  mapped.sort((a, b) => b.match.score - a.match.score);
  return mapped;
}

export async function getJobDetail(
  userId: string,
  jobId: string
): Promise<JobDetailDto | null> {
  const [jobRow] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!jobRow) return null;

  const [userProfile, appRows, stateRows, tailoredCountRows] = await Promise.all([
    getProfile(userId),
    db
      .select({ id: applications.id, status: applications.status })
      .from(applications)
      .where(and(eq(applications.userId, userId), eq(applications.jobId, jobId)))
      .limit(1),
    db
      .select({ state: jobStates.state })
      .from(jobStates)
      .where(and(eq(jobStates.userId, userId), eq(jobStates.jobId, jobId)))
      .limit(1),
    db
      .select({ value: count() })
      .from(tailoredDocuments)
      .where(and(eq(tailoredDocuments.userId, userId), eq(tailoredDocuments.jobId, jobId))),
  ]);

  const match = computeJobMatch(userProfile, jobRow);
  const intelligence = analyzeJobIntelligence(jobRow);
  const existingApp = appRows[0];

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
    userState: stateRows[0]?.state ?? null,
    applicationId: existingApp?.id ?? null,
    applicationStatus: existingApp?.status ?? null,
    intelligence,
    tailoredDocumentsCount: Number(tailoredCountRows[0]?.value ?? 0),
  };
}

export async function setJobState(
  userId: string,
  jobId: string,
  state: 'saved' | 'dismissed'
): Promise<{
  userState: 'saved' | 'dismissed';
  applicationId: string | null;
  applicationStatus: ApplicationStatus | null;
} | null> {
  const [jobRow] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!jobRow) return null;

  await db
    .insert(jobStates)
    .values({
      userId,
      jobId,
      state,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [jobStates.userId, jobStates.jobId],
      set: { state, updatedAt: new Date() },
    });

  const [existingApp] = await db
    .select({ id: applications.id, status: applications.status })
    .from(applications)
    .where(and(eq(applications.userId, userId), eq(applications.jobId, jobId)))
    .limit(1);

  if (state === 'saved' && !existingApp) {
    const profile = await getProfile(userId);
    const match = computeJobMatch(profile, jobRow);
    const [createdApp] = await db
      .insert(applications)
      .values({
        userId,
        jobId: jobRow.id,
        company: jobRow.company,
        title: jobRow.title,
        location: jobRow.location,
        url: jobRow.url,
        status: 'saved',
        matchScore: match.score,
      })
      .returning({ id: applications.id, status: applications.status });

    if (createdApp) {
      await db.insert(applicationEvents).values({
        applicationId: createdApp.id,
        userId,
        type: 'created',
        description: 'Saved from Discover Jobs',
      });
      return {
        userState: state,
        applicationId: createdApp.id,
        applicationStatus: createdApp.status,
      };
    }
  }

  return {
    userState: state,
    applicationId: existingApp?.id ?? null,
    applicationStatus: existingApp?.status ?? null,
  };
}

export async function clearJobState(
  userId: string,
  jobId: string
): Promise<boolean> {
  const deleted = await db
    .delete(jobStates)
    .where(and(eq(jobStates.userId, userId), eq(jobStates.jobId, jobId)))
    .returning({ id: jobStates.id });
  return deleted.length > 0;
}

