import { Injectable, Logger } from "@nestjs/common";
import type { AuditAction } from "@applypilot/shared";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface AuditMeta {
  ipAddress?: string;
  userAgent?: string;
  [key: string]: unknown;
}

// A write here must never be able to break the request it's logging —
// audit logging is observability, not a transactional invariant. Failures
// are swallowed (and logged) rather than propagated.
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(userId: string | null, action: AuditAction, meta: AuditMeta = {}): Promise<void> {
    const { ipAddress, userAgent, ...metadata } = meta;
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          ipAddress,
          userAgent,
          metadata:
            Object.keys(metadata).length > 0 ? (metadata as Prisma.InputJsonValue) : undefined,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to record audit log for action=${action}`, error as Error);
    }
  }
}
