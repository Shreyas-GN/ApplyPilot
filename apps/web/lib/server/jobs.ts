import { desc, eq, ilike, or, and, gte, count, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  applicationEvents,
  applications,
  jobBoards,
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

// Seeded board definitions — only boards whose ATS endpoints are publicly accessible
const DEFAULT_BOARDS: BoardSource[] = [
  { provider: 'greenhouse', slug: 'vercel', companyName: 'Vercel' },
  { provider: 'greenhouse', slug: 'anthropic', companyName: 'Anthropic' },
  { provider: 'greenhouse', slug: 'stripe', companyName: 'Stripe' },
  { provider: 'greenhouse', slug: 'figma', companyName: 'Figma' },
];

// Number of consecutive missed syncs before a job is closed
const CLOSURE_MISS_THRESHOLD = 2;

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

interface BoardSyncResult {
  synced: number;
  closed: number;
  reopened: number;
  skipped: boolean;
  skipReason?: string;
}

// ─── Board registry ──────────────────────────────────────────────────────────

export async function ensureDefaultBoardsSeeded(): Promise<void> {
  for (const board of DEFAULT_BOARDS) {
    await db
      .insert(jobBoards)
      .values({
        provider: board.provider,
        slug: board.slug,
        companyName: board.companyName,
        isEnabled: true,
      })
      .onConflictDoNothing();
  }
}

async function getEnabledBoards(): Promise<BoardSource[]> {
  const rows = await db
    .select({
      provider: jobBoards.provider,
      slug: jobBoards.slug,
      companyName: jobBoards.companyName,
    })
    .from(jobBoards)
    .where(eq(jobBoards.isEnabled, true));

  return rows as BoardSource[];
}

async function markBoardSynced(provider: string, slug: string, errorOccurred: boolean): Promise<void> {
  await db
    .update(jobBoards)
    .set({
      lastSyncedAt: new Date(),
      errorCount: errorOccurred
        ? sql`${jobBoards.errorCount} + 1`
        : sql`0`,
      updatedAt: new Date(),
    })
    .where(and(eq(jobBoards.provider, provider), eq(jobBoards.slug, slug)));
}

async function disableBoard(provider: string, slug: string): Promise<void> {
  await db
    .update(jobBoards)
    .set({ isEnabled: false, updatedAt: new Date() })
    .where(and(eq(jobBoards.provider, provider), eq(jobBoards.slug, slug)));
}

// ─── Closure detection ───────────────────────────────────────────────────────

/**
 * Detect and apply closures for a board after a successful, non-empty sync.
 * - Jobs not seen in this sync have their miss_count incremented.
 * - Jobs seen after being inactive are reopened (miss_count reset, is_active = true).
 * - Jobs with miss_count >= CLOSURE_MISS_THRESHOLD are marked closed.
 *
 * MUST NOT be called when the provider returned an empty or partial response.
 */
async function detectClosures(
  boardSource: string,
  boardSlug: string,
  seenExternalIds: Set<string>
): Promise<{ closed: number; reopened: number }> {
  const sourceKey = boardSource;

  // Find all active jobs for this board that were NOT seen in this sync
  const activeJobs = await db
    .select({ id: jobs.id, externalId: jobs.externalId, missCount: jobs.missCount })
    .from(jobs)
    .where(and(eq(jobs.source, sourceKey), eq(jobs.isActive, true)));

  const missedJobs = activeJobs.filter(
    (j) => !seenExternalIds.has(j.externalId)
  );

  let closed = 0;

  for (const job of missedJobs) {
    const newMissCount = job.missCount + 1;
    if (newMissCount >= CLOSURE_MISS_THRESHOLD) {
      await db
        .update(jobs)
        .set({
          isActive: false,
          closedAt: new Date(),
          missCount: newMissCount,
        })
        .where(eq(jobs.id, job.id));
      closed++;
    } else {
      await db
        .update(jobs)
        .set({ missCount: newMissCount })
        .where(eq(jobs.id, job.id));
    }
  }

  // Reopen any previously-closed jobs that reappeared in this sync
  const seenIdsList = [...seenExternalIds];
  const reopened = seenIdsList.length > 0
    ? (await db
        .update(jobs)
        .set({ isActive: true, closedAt: null, missCount: 0 })
        .where(
          and(
            eq(jobs.source, sourceKey),
            eq(jobs.isActive, false),
            inArray(jobs.externalId, seenIdsList)
          )
        )
        .returning({ id: jobs.id })).length
    : 0;

  if (closed > 0 || reopened > 0) {
    console.info(
      `[Jobs Closure] ${sourceKey}:${boardSlug} — closed: ${closed}, reopened: ${reopened}`
    );
  }

  return { closed, reopened };
}

// ─── Upsert helpers ──────────────────────────────────────────────────────────

type UpsertJobRow = typeof jobs.$inferInsert;

async function upsertJobBatch(rows: UpsertJobRow[]): Promise<{ upserted: number; seenIds: Set<string> }> {
  if (rows.length === 0) return { upserted: 0, seenIds: new Set() };

  const dedupedMap = new Map<string, UpsertJobRow>();
  for (const row of rows) {
    dedupedMap.set(`${row.source}:${row.externalId}`, row);
  }
  const deduped = [...dedupedMap.values()];
  const seenIds = new Set(deduped.map((r) => r.externalId));

  await db
    .insert(jobs)
    .values(deduped)
    .onConflictDoUpdate({
      target: [jobs.source, jobs.externalId],
      set: {
        title: sql`excluded.title`,
        location: sql`excluded.location`,
        workMode: sql`excluded.work_mode`,
        url: sql`excluded.url`,
        description: sql`excluded.description`,
        skills: sql`excluded.skills`,
        postedAt: sql`excluded.posted_at`,
        isActive: true,
        missCount: 0,
        closedAt: null,
      },
    });

  return { upserted: deduped.length, seenIds };
}

// ─── Provider fetchers ───────────────────────────────────────────────────────

async function fetchGreenhouseJobs(slug: string): Promise<GreenhouseJob[] | null> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`;
  const res = await fetch(url, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Greenhouse API returned ${res.status} for ${slug}`);
  }
  const data = (await res.json()) as { jobs?: GreenhouseJob[] };
  return data.jobs ?? null;
}

async function fetchLeverPostings(slug: string): Promise<LeverPosting[] | null> {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`;
  const res = await fetch(url, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Lever API returned ${res.status} for ${slug}`);
  }
  const data = await res.json() as unknown;
  if (!Array.isArray(data)) return null;
  return data as LeverPosting[];
}

// ─── Board ingestion ─────────────────────────────────────────────────────────

async function ingestGreenhouseBoard(slug: string, companyName: string): Promise<BoardSyncResult> {
  let items: GreenhouseJob[];

  try {
    const fetched = await fetchGreenhouseJobs(slug);

    if (fetched === null) {
      console.warn(`[Jobs Sync] Greenhouse ${slug}: unexpected null response — skipping closure detection`);
      return { synced: 0, closed: 0, reopened: 0, skipped: true, skipReason: 'null_response' };
    }

    if (fetched.length === 0) {
      console.warn(`[Jobs Sync] Greenhouse ${slug}: returned 0 jobs (suspicious empty response) — skipping closure detection`);
      return { synced: 0, closed: 0, reopened: 0, skipped: true, skipReason: 'empty_response' };
    }

    items = fetched.slice(0, 20);
  } catch (error) {
    throw error;
  }

  const rows: UpsertJobRow[] = items.map((item) => {
    const cleanDescription = stripHtml(item.content ?? '');
    const location = item.location?.name ?? null;
    const workMode = inferWorkMode(item.title, location, cleanDescription);
    const skills = extractJobSkills(item.title, cleanDescription);
    const postedAt = item.updated_at ? new Date(item.updated_at) : null;
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
    };
  });

  const { upserted, seenIds } = await upsertJobBatch(rows);
  const { closed, reopened } = await detectClosures('greenhouse', slug, seenIds);

  return { synced: upserted, closed, reopened, skipped: false };
}

async function ingestLeverBoard(slug: string, companyName: string): Promise<BoardSyncResult> {
  let items: LeverPosting[];

  try {
    const fetched = await fetchLeverPostings(slug);

    if (fetched === null) {
      console.warn(`[Jobs Sync] Lever ${slug}: unexpected null/non-array response — skipping closure detection`);
      return { synced: 0, closed: 0, reopened: 0, skipped: true, skipReason: 'null_response' };
    }

    if (fetched.length === 0) {
      console.warn(`[Jobs Sync] Lever ${slug}: returned 0 postings (suspicious empty response) — skipping closure detection`);
      return { synced: 0, closed: 0, reopened: 0, skipped: true, skipReason: 'empty_response' };
    }

    items = fetched.slice(0, 20);
  } catch (error) {
    throw error;
  }

  const rows: UpsertJobRow[] = items.map((item) => {
    const cleanDescription =
      item.descriptionPlain ?? stripHtml(item.description ?? '');
    const location = item.categories?.location ?? null;
    const workMode = inferWorkMode(item.text, location, cleanDescription);
    const skills = extractJobSkills(item.text, cleanDescription);
    const postedAt = item.createdAt ? new Date(item.createdAt) : null;
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
    };
  });

  const { upserted, seenIds } = await upsertJobBatch(rows);
  const { closed, reopened } = await detectClosures('lever', slug, seenIds);

  return { synced: upserted, closed, reopened, skipped: false };
}

// ─── Public sync entry point ─────────────────────────────────────────────────

export async function syncPublicJobs(
  customBoards?: BoardSource[]
): Promise<{ synced: number; closed: number; boardsChecked: number; boardsFailed: number }> {
  let boards: BoardSource[];

  if (customBoards && customBoards.length > 0) {
    boards = customBoards;
  } else {
    // Try DB-configured boards; fall back to defaults if table is empty
    try {
      const dbBoards = await getEnabledBoards();
      boards = dbBoards.length > 0 ? dbBoards : DEFAULT_BOARDS;
    } catch {
      boards = DEFAULT_BOARDS;
    }
  }

  let totalSynced = 0;
  let totalClosed = 0;
  let boardsFailed = 0;

  for (const board of boards) {
    try {
      let result: BoardSyncResult | null = null;
      if (board.provider === 'greenhouse') {
        result = await ingestGreenhouseBoard(board.slug, board.companyName);
      } else if (board.provider === 'lever') {
        result = await ingestLeverBoard(board.slug, board.companyName);
      }

      if (result) {
        totalSynced += result.synced;
        totalClosed += result.closed;
        await markBoardSynced(board.provider, board.slug, false);
      }
    } catch (error) {
      boardsFailed++;
      console.warn(`[Jobs Sync] Failed syncing ${board.provider}:${board.slug}`, error);
      try {
        await markBoardSynced(board.provider, board.slug, true);
      } catch {
        // best-effort board tracking; never block other boards
      }
    }
  }

  return { synced: totalSynced, closed: totalClosed, boardsChecked: boards.length, boardsFailed };
}

// ─── Job listing and details (unchanged) ─────────────────────────────────────

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

let initialJobsSeedPromise: Promise<void> | null = null;

async function ensureJobsSeededIfEmpty() {
  try {
    const [countRow] = await db.select({ total: count() }).from(jobs);
    if ((countRow?.total ?? 0) > 0) return;

    if (!initialJobsSeedPromise) {
      initialJobsSeedPromise = syncPublicJobs()
        .then(() => undefined)
        .catch((error) => {
          console.warn('[Jobs Seed] Initial public board sync skipped:', error);
        })
        .finally(() => {
          initialJobsSeedPromise = null;
        });
    }
    await initialJobsSeedPromise;
  } catch (error) {
    console.warn('[Jobs Seed] Failed checking job catalog count:', error);
  }
}

export async function listMatchedJobs(
  userId: string,
  options: ListJobsOptions = {}
): Promise<JobDto[]> {
  await ensureJobsSeededIfEmpty();
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
  // Only show active jobs in discovery
  conditions.push(eq(jobs.isActive, true));

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
      .where(and(...conditions))
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
        source: 'discover_jobs',
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
