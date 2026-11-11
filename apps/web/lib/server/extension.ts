import { createHash, randomBytes } from 'node:crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  applicationEvents,
  applications,
  extensionSessions,
  resumes,
} from '@/lib/db/schema';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  ApplicationDto,
  ApplicationStatus,
  ExtensionSessionDto,
  ProfileDto,
} from '@/lib/types';
import { recordAudit } from './audit';
import { getProfile } from './profile';

export interface ExtensionAutofillPayload {
  profile: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    portfolioUrl: string | null;
    headline: string | null;
    summary: string | null;
  };
  primaryResume: {
    id: string;
    filename: string;
    downloadUrl: string | null;
  } | null;
}

export interface CaptureExtensionApplicationInput {
  company: string;
  title: string;
  location?: string | null;
  url: string;
  ats?: string;
  status?: ApplicationStatus;
  filledFields?: string[];
}

export function hashExtensionToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function extractBearerToken(
  authHeader: string | null | undefined
): string | null {
  if (!authHeader) return null;
  const match = authHeader.trim().match(/^Bearer\s+(.+)$/i);
  return match && match[1] ? match[1].trim() : null;
}

function toExtensionSessionDto(
  row: typeof extensionSessions.$inferSelect
): ExtensionSessionDto {
  return {
    id: row.id,
    label: row.label,
    lastUsedAt: row.lastUsedAt ? row.lastUsedAt.toISOString() : null,
    revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createPairingToken(
  userId: string,
  label = 'Chrome Extension'
): Promise<{ session: ExtensionSessionDto; token: string }> {
  const token = `ap_ext_${randomBytes(24).toString('hex')}`;
  const tokenHash = hashExtensionToken(token);

  const [created] = await db
    .insert(extensionSessions)
    .values({
      userId,
      label: label.trim() || 'Chrome Extension',
      tokenHash,
    })
    .returning();

  if (!created) {
    throw new Error('Failed to create extension pairing session.');
  }

  await recordAudit(userId, 'extension_paired', {
    sessionId: created.id,
    label: created.label,
  });

  return {
    session: toExtensionSessionDto(created),
    token,
  };
}

export async function listExtensionSessions(
  userId: string
): Promise<ExtensionSessionDto[]> {
  const rows = await db
    .select()
    .from(extensionSessions)
    .where(eq(extensionSessions.userId, userId))
    .orderBy(desc(extensionSessions.createdAt))
    .limit(20);

  return rows.map(toExtensionSessionDto);
}

export async function revokeExtensionSession(
  userId: string,
  sessionId: string
): Promise<boolean> {
  const updated = await db
    .update(extensionSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(extensionSessions.id, sessionId),
        eq(extensionSessions.userId, userId),
        isNull(extensionSessions.revokedAt)
      )
    )
    .returning({ id: extensionSessions.id });

  if (updated.length > 0) {
    await recordAudit(userId, 'extension_revoked', { sessionId });
    return true;
  }
  return false;
}

export async function verifyExtensionBearer(
  authHeader: string | null | undefined
): Promise<{ userId: string; sessionId: string } | null> {
  const token = extractBearerToken(authHeader);
  if (!token || !token.startsWith('ap_ext_')) {
    return null;
  }

  const tokenHash = hashExtensionToken(token);
  const [session] = await db
    .select()
    .from(extensionSessions)
    .where(
      and(
        eq(extensionSessions.tokenHash, tokenHash),
        isNull(extensionSessions.revokedAt)
      )
    )
    .limit(1);

  if (!session) return null;

  await db
    .update(extensionSessions)
    .set({ lastUsedAt: new Date() })
    .where(eq(extensionSessions.id, session.id));

  return { userId: session.userId, sessionId: session.id };
}

export async function getExtensionAutofillPayload(
  userId: string,
  userEmail: string | null
): Promise<ExtensionAutofillPayload> {
  const profile: ProfileDto = await getProfile(userId);

  const [primary] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.userId, userId), eq(resumes.isPrimary, true)))
    .limit(1);

  let downloadUrl: string | null = null;
  if (primary?.storageKey) {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase.storage
        .from('resumes')
        .createSignedUrl(primary.storageKey, 300);
      downloadUrl = data?.signedUrl ?? null;
    } catch {
      downloadUrl = null;
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
  };
}

export async function captureApplicationFromExtension(
  userId: string,
  input: CaptureExtensionApplicationInput
): Promise<ApplicationDto> {
  const nextStatus: ApplicationStatus = input.status ?? 'saved';
  const filledFields = input.filledFields ?? [];
  const atsLabel = input.ats ? ` (${input.ats})` : '';

  // Reuse existing application if this exact URL was already tracked by the user
  const [existing] = await db
    .select()
    .from(applications)
    .where(
      and(eq(applications.userId, userId), eq(applications.url, input.url))
    )
    .limit(1);

  if (existing) {
    const shouldAdvanceStatus =
      nextStatus === 'applied' && existing.status === 'saved';

    const [updated] = await db
      .update(applications)
      .set({
        status: shouldAdvanceStatus ? 'applied' : existing.status,
        appliedAt:
          shouldAdvanceStatus && !existing.appliedAt
            ? new Date()
            : existing.appliedAt,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, existing.id))
      .returning();

    const row = updated ?? existing;

    if (filledFields.length > 0) {
      await db.insert(applicationEvents).values({
        applicationId: row.id,
        userId,
        type: 'extension_autofill',
        description: `Extension Co-pilot filled ${filledFields.join(', ')}${atsLabel}`,
      });
    } else if (shouldAdvanceStatus) {
      await db.insert(applicationEvents).values({
        applicationId: row.id,
        userId,
        type: 'status_change',
        description: `Marked applied from Chrome Extension${atsLabel}`,
      });
    }

    await recordAudit(userId, 'extension_activity', {
      applicationId: row.id,
      ats: input.ats ?? 'unknown',
      filledFields,
      status: row.status,
    });

    return toExtensionApplicationDto(row);
  }

  const [created] = await db
    .insert(applications)
    .values({
      userId,
      company: input.company.trim(),
      title: input.title.trim(),
      location: input.location?.trim() || null,
      url: input.url.trim(),
      status: nextStatus,
      appliedAt: nextStatus === 'applied' ? new Date() : null,
    })
    .returning();

  if (!created) {
    throw new Error('Failed to save application from extension.');
  }

  await db.insert(applicationEvents).values({
    applicationId: created.id,
    userId,
    type: filledFields.length > 0 ? 'extension_autofill' : 'created',
    description:
      filledFields.length > 0
        ? `Captured via Chrome Extension${atsLabel} and autofilled: ${filledFields.join(', ')}`
        : `Saved from Chrome Extension${atsLabel}`,
  });

  await recordAudit(userId, 'extension_activity', {
    applicationId: created.id,
    ats: input.ats ?? 'unknown',
    filledFields,
    status: created.status,
  });

  return toExtensionApplicationDto(created);
}

function toExtensionApplicationDto(
  row: typeof applications.$inferSelect
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
  };
}

