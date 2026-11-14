import { prisma } from '@/lib/db/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AuditLogDto } from '@/lib/types'
import { listApplications } from './applications'
import { recordAudit } from './audit'
import { getProfile } from './profile'
import { listResumes } from './resumes'
import { listTailoredDocuments } from './tailoring'

export async function listAccountActivity(userId: string): Promise<AuditLogDto[]> {
  const rows = await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function exportUserData(userId: string) {
  const [profile, userResumes, userApplications, tailoredDocs, activity] = await Promise.all([
    getProfile(userId),
    listResumes(userId),
    listApplications(userId),
    listTailoredDocuments(userId),
    listAccountActivity(userId),
  ])

  await recordAudit(userId, 'account_data_exported', {
    resumeCount: userResumes.length,
    applicationCount: userApplications.length,
    tailoredDocumentCount: tailoredDocs.length,
  })

  return {
    exportedAt: new Date().toISOString(),
    userId,
    profile,
    resumes: userResumes,
    applications: userApplications,
    tailoredDocuments: tailoredDocs,
    recentActivity: activity,
  }
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const userResumes = await prisma.resume.findMany({
    where: { userId },
    select: { storageKey: true },
  })

  const storageKeys = userResumes.map((r) => r.storageKey).filter((k): k is string => Boolean(k))

  const supabase = createAdminClient()

  if (storageKeys.length > 0) {
    const { error: storageError } = await supabase.storage.from('resumes').remove(storageKeys)
    if (storageError) throw new Error(`Failed to delete stored resume files: ${storageError.message}`)
  }

  const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId)
  if (deleteUserError) throw new Error(`Failed to delete account: ${deleteUserError.message}`)
}
