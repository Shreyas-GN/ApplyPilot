import { prisma } from '@/lib/db/prisma'

export async function recordAudit(
  userId: string | null,
  action: string,
  metadata?: Record<string, unknown>,
  options?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? undefined,
        action,
        metadata: metadata ? (metadata as unknown as import('@prisma/client').Prisma.InputJsonValue) : undefined,
        ipAddress: options?.ipAddress ?? undefined,
        userAgent: options?.userAgent ?? undefined,
      },
    })
  } catch {
    // Audit logging must never crash the caller
  }
}
