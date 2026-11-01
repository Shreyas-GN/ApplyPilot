import { createSystemHealthWorker } from "./queues/system-health.queue";

function main(): void {
  const worker = createSystemHealthWorker();

  worker.on("ready", () => {
    console.log("[workers] system-health worker ready");
  });

  worker.on("error", (err) => {
    console.error("[workers] worker error", err);
  });

  const shutdown = async (): Promise<void> => {
    await worker.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
