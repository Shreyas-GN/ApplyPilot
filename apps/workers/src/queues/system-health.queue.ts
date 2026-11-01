import { Queue, Worker, type Job } from "bullmq";
import { createQueueConnection } from "../redis";

// Reference implementation for the queue/worker pattern used by the real
// workers added in later phases (job ingestion, matching, tailoring,
// notifications — see docs/SYSTEM_ARCHITECTURE.md §4). Not a product feature
// itself: it only proves the Redis + BullMQ wiring is sound.

export const SYSTEM_HEALTH_QUEUE = "system-health";

export interface SystemHealthJobData {
  pingedAt: string;
}

export function createSystemHealthQueue(): Queue<SystemHealthJobData> {
  return new Queue<SystemHealthJobData>(SYSTEM_HEALTH_QUEUE, {
    connection: createQueueConnection(),
  });
}

export function createSystemHealthWorker(): Worker<SystemHealthJobData> {
  return new Worker<SystemHealthJobData>(
    SYSTEM_HEALTH_QUEUE,
    async (job: Job<SystemHealthJobData>) => {
      return { receivedAt: new Date().toISOString(), echo: job.data.pingedAt };
    },
    { connection: createQueueConnection() },
  );
}
