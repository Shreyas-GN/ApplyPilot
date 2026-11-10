import "dotenv/config";
import { createSystemHealthWorker } from "./queues/system-health.queue";
import { createResumeParsingWorker } from "./queues/resume-parsing.queue";

function main(): void {
  const systemHealthWorker = createSystemHealthWorker();
  const resumeParsingWorker = createResumeParsingWorker();
  const workers = [systemHealthWorker, resumeParsingWorker];

  systemHealthWorker.on("ready", () => console.log("[workers] system-health worker ready"));
  resumeParsingWorker.on("ready", () => console.log("[workers] resume-parsing worker ready"));

  for (const worker of workers) {
    worker.on("error", (err) => console.error("[workers] worker error", err));
    worker.on("failed", (job, err) =>
      console.error(`[workers] job ${job?.id} failed on queue ${worker.name}:`, err.message),
    );
  }

  const shutdown = async (): Promise<void> => {
    await Promise.all(workers.map((worker) => worker.close()));
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
