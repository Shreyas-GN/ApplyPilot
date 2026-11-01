import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";

export const RESUME_PARSING_QUEUE_NAME = "resume-parsing";

export interface ResumeParsingJobData {
  resumeId: string;
}

// Thin producer-side wrapper — apps/workers owns the actual Worker consuming
// this queue (text extraction + AI parsing, see docs/AI_AGENTS.md).
@Injectable()
export class ResumeParsingQueueService implements OnModuleDestroy {
  private readonly queue: Queue<ResumeParsingJobData>;

  constructor(config: ConfigService) {
    this.queue = new Queue<ResumeParsingJobData>(RESUME_PARSING_QUEUE_NAME, {
      connection: parseRedisUrl(config.getOrThrow<string>("REDIS_URL")),
    });
  }

  async enqueue(resumeId: string): Promise<void> {
    await this.queue.add("parse", { resumeId }, { removeOnComplete: 100, removeOnFail: 500 });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}

function parseRedisUrl(url: string): { host: string; port: number; password?: string } {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    password: parsed.password || undefined,
  };
}
