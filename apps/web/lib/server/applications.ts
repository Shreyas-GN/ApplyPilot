import { db } from '@/lib/db';
import { applicationEvents, applications, jobs } from '@/lib/db/schema';
import type {
  ApplicationDto,
  ApplicationEventDto,
  ApplicationStatus,
} from '@/lib/types';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { recordAudit } from './audit';

export interface CreateApplicationInput {
  jobId?: string;
  company: string;
  title: string;
  location?: string | null;
  url?: string | null;
  status?: ApplicationStatus;
  matchScore?: number | null;
  notes?: string | null;
}

export interface UpdateApplicationInput {
  status?: ApplicationStatus;
  notes?: string | null;
}

export async function listApplications(
  userId: string
): Promise<ApplicationDto[]> {
  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.updatedAt));

  if (rows.length === 0) return [];

  const appIds = rows.map((r) => r.id);
  const events = await db
    .select()
    .from(applicationEvents)
    .where(
      and(
        eq(applicationEvents.userId, userId),
        inArray(applicationEvents.applicationId, appIds)
      )
    )
    .orderBy(desc(applicationEvents.createdAt));

  const eventsByApp = new Map<string, ApplicationEventDto[]>();
  for (const ev of events) {
    const list = eventsByApp.get(ev.applicationId) ?? [];
    list.push({
      id: ev.id,
      type: ev.type,
      description: ev.description,
      createdAt: ev.createdAt.toISOString(),
    });
    eventsByApp.set(ev.applicationId, list);
  }

  return rows.map((row) => toApplicationDto(row, eventsByApp.get(row.id) ?? []));
}

export async function createApplication(
  userId: string,
  input: CreateApplicationInput
): Promise<ApplicationDto> {
  // Prevent duplicate tracking for the same jobId
  if (input.jobId) {
    const [existing] = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.jobId, input.jobId)
        )
      )
      .limit(1);

    if (existing) {
      return toApplicationDto(existing, []);
    }

    // Verify job exists if jobId provided
    const [jobRow] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.id, input.jobId))
      .limit(1);
    if (!jobRow) {
      throw new Error('Job not found.');
    }
  }

  const initialStatus: ApplicationStatus = input.status ?? 'saved';
  const appliedAt = initialStatus === 'applied' ? new Date() : null;

  const created = await db.transaction(async (tx) => {
    const [app] = await tx
      .insert(applications)
      .values({
        userId,
        jobId: input.jobId ?? null,
        company: input.company.trim(),
        title: input.title.trim(),
        location: input.location?.trim() || null,
        url: input.url?.trim() || null,
        status: initialStatus,
        matchScore: input.matchScore ?? null,
        notes: input.notes?.trim() || null,
        appliedAt,
      })
      .returning();

    if (!app) {
      throw new Error('Failed to create application.');
    }

    await tx.insert(applicationEvents).values({
      applicationId: app.id,
      userId,
      type: 'created',
      description: `Added to tracker as "${initialStatus}"`,
    });

    return app;
  });

  await recordAudit(userId, 'application_created', {
    applicationId: created.id,
    company: created.company,
    status: created.status,
  });

  return toApplicationDto(created, [
    {
      id: 'initial',
      type: 'created',
      description: `Added to tracker as "${initialStatus}"`,
      createdAt: created.createdAt.toISOString(),
    },
  ]);
}

export async function updateApplication(
  userId: string,
  appId: string,
  input: UpdateApplicationInput
): Promise<ApplicationDto> {
  const [existing] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, appId), eq(applications.userId, userId)))
    .limit(1);

  if (!existing) {
    throw new Error('Application not found.');
  }

  const nextStatus = input.status ?? existing.status;
  const statusChanged = input.status !== undefined && input.status !== existing.status;
  const notesChanged = input.notes !== undefined && input.notes !== existing.notes;

  const updateFields: Partial<typeof applications.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.status !== undefined) {
    updateFields.status = input.status;
    if (input.status === 'applied' && !existing.appliedAt) {
      updateFields.appliedAt = new Date();
    }
  }
  if (input.notes !== undefined) {
    updateFields.notes = input.notes?.trim() || null;
  }

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(applications)
      .set(updateFields)
      .where(and(eq(applications.id, appId), eq(applications.userId, userId)))
      .returning();

    if (!row) {
      throw new Error('Failed to update application.');
    }

    if (statusChanged) {
      await tx.insert(applicationEvents).values({
        applicationId: appId,
        userId,
        type: 'status_change',
        description: `Moved from "${existing.status}" to "${nextStatus}"`,
      });
    } else if (notesChanged) {
      await tx.insert(applicationEvents).values({
        applicationId: appId,
        userId,
        type: 'note',
        description: 'Updated application notes',
      });
    }

    return row;
  });

  const events = await db
    .select()
    .from(applicationEvents)
    .where(eq(applicationEvents.applicationId, appId))
    .orderBy(desc(applicationEvents.createdAt));

  return toApplicationDto(
    updated,
    events.map((e) => ({
      id: e.id,
      type: e.type,
      description: e.description,
      createdAt: e.createdAt.toISOString(),
    }))
  );
}

export async function deleteApplication(
  userId: string,
  appId: string
): Promise<void> {
  const [deleted] = await db
    .delete(applications)
    .where(and(eq(applications.id, appId), eq(applications.userId, userId)))
    .returning({ id: applications.id });

  if (!deleted) {
    throw new Error('Application not found.');
  }

  await recordAudit(userId, 'application_deleted', { applicationId: appId });
}

function toApplicationDto(
  row: typeof applications.$inferSelect,
  events: ApplicationEventDto[]
): ApplicationDto {
  return {
    id: row.id,
    jobId: row.jobId,
    company: row.company,
    title: row.title,
    location: row.location,
    url: row.url,
    status: row.status,
    matchScore: row.matchScore,
    notes: row.notes,
    appliedAt: row.appliedAt ? row.appliedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    events,
  };
}

