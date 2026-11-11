import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auditLogs, resumes } from '@/lib/db/schema';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AuditLogDto } from '@/lib/types';
import { listApplications } from './applications';
import { recordAudit } from './audit';
import { getProfile } from './profile';
import { listResumes } from './resumes';
import { listTailoredDocuments } from './tailoring';

export async function listAccountActivity(
  userId: string
): Promise<AuditLogDto[]> {
  const rows = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function exportUserData(userId: string) {
  const [profile, userResumes, userApplications, tailoredDocs, activity] =
    await Promise.all([
      getProfile(userId),
      listResumes(userId),
      listApplications(userId),
      listTailoredDocuments(userId),
      listAccountActivity(userId),
    ]);

  await recordAudit(userId, 'account_data_exported', {
    resumeCount: userResumes.length,
    applicationCount: userApplications.length,
    tailoredDocumentCount: tailoredDocs.length,
  });

  return {
    exportedAt: new Date().toISOString(),
    userId,
    profile,
    resumes: userResumes,
    applications: userApplications,
    tailoredDocuments: tailoredDocs,
    recentActivity: activity,
  };
}

export async function deleteUserAccount(userId: string): Promise<void> {
  // 1. Collect all storage keys before deleting the user so files do not orphan
  const userResumes = await db
    .select({ storageKey: resumes.storageKey })
    .from(resumes)
    .where(eq(resumes.userId, userId));

  const storageKeys = userResumes
    .map((r) => r.storageKey)
    .filter((k): k is string => Boolean(k));

  const supabase = createAdminClient();

  if (storageKeys.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('resumes')
      .remove(storageKeys);
    if (storageError) {
      throw new Error(
        `Failed to delete stored resume files: ${storageError.message}`
      );
    }
  }

  // 2. Delete auth user via Supabase Admin API — cascades across all user tables
  const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteUserError) {
    throw new Error(`Failed to delete account: ${deleteUserError.message}`);
  }
}

