import { Inject, Injectable } from "@nestjs/common";
import type { HealthCheckResponse } from "@applypilot/shared";
import type Redis from "ioredis";
import { PrismaService } from "../prisma/prisma.service";
import { REDIS_CLIENT } from "../redis/redis.module";

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async check(): Promise<HealthCheckResponse> {
    const [database, redis] = await Promise.all([this.checkDatabase(), this.checkRedis()]);

    return {
      status: database === "ok" && redis === "ok" ? "ok" : "degraded",
      checks: { database, redis },
      version: process.env.npm_package_version ?? "0.0.0",
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<"ok" | "error"> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return "ok";
    } catch {
      return "error";
    }
  }

  private async checkRedis(): Promise<"ok" | "error"> {
    try {
      const pong = await this.redis.ping();
      return pong === "PONG" ? "ok" : "error";
    } catch {
      return "error";
    }
  }
}
