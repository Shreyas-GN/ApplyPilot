import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';

export interface AuditMeta {
  ipAddress?: string;
  userAgent?: string;
  [key: string]: unknown;
}

export async function recordAudit(
  userId: string | null,
  action: string,
  meta: AuditMeta = {}
): Promise<void> {
  const { ipAddress, userAgent, ...metadata } = meta;
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      ipAddress: typeof ipAddress === 'string' ? ipAddress : null,
      userAgent: typeof userAgent === 'string' ? userAgent : null,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    });
  } catch (error) {
    console.warn(`[Audit] Failed to record audit log for action=${action}`, error);
  }
}

