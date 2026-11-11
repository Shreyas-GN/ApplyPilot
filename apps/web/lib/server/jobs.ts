import { desc, eq, ilike, or, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { applications, jobs } from '@/lib/db/schema';
import type { ApplicationStatus, JobDto } from '@/lib/types';
import { getProfile } from './profile';
import {
  computeJobMatch,
  extractJobSkills,
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

export async function listMatchedJobs(
  userId: string,
  options: { q?: string; workMode?: string; limit?: number } = {}
): Promise<JobDto[]> {
  const { q, workMode, limit = 60 } = options;

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

  const [jobRows, userProfile, userApps] = await Promise.all([
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
  ]);

  const appByJobId = new Map<
    string,
    { id: string; status: ApplicationStatus }
  >();
  for (const app of userApps) {
    if (app.jobId) {
      appByJobId.set(app.jobId, { id: app.id, status: app.status });
    }
  }

  const mapped: JobDto[] = jobRows.map((job) => {
    const match = computeJobMatch(userProfile, job);
    const existingApp = appByJobId.get(job.id);
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
      applicationId: existingApp?.id ?? null,
      applicationStatus: existingApp?.status ?? null,
    };
  });

  // Sort highest match first
  mapped.sort((a, b) => b.match.score - a.match.score);
  return mapped;
}

