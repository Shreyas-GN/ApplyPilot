import { describe, expect, it, vi } from "vitest";
import { HealthService } from "./health.service";
import type { PrismaService } from "../prisma/prisma.service";
import type Redis from "ioredis";

describe("HealthService", () => {
  function buildService(prismaOk: boolean, redisOk: boolean) {
    const prisma = {
      $queryRaw: prismaOk ? vi.fn().mockResolvedValue([{ "?column?": 1 }]) : vi.fn().mockRejectedValue(new Error("db down")),
    } as unknown as PrismaService;

    const redis = {
      ping: redisOk ? vi.fn().mockResolvedValue("PONG") : vi.fn().mockRejectedValue(new Error("redis down")),
    } as unknown as Redis;

    return new HealthService(prisma, redis);
  }

  it("reports ok when both checks succeed", async () => {
    const service = buildService(true, true);
    const result = await service.check();
    expect(result.status).toBe("ok");
    expect(result.checks).toEqual({ database: "ok", redis: "ok" });
  });

  it("reports degraded when the database check fails", async () => {
    const service = buildService(false, true);
    const result = await service.check();
    expect(result.status).toBe("degraded");
    expect(result.checks.database).toBe("error");
  });

  it("reports degraded when the redis check fails", async () => {
    const service = buildService(true, false);
    const result = await service.check();
    expect(result.status).toBe("degraded");
    expect(result.checks.redis).toBe("error");
  });
});
