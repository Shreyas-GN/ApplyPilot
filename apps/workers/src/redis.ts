import "dotenv/config";
import Redis from "ioredis";
import { parseNodeEnv } from "@applypilot/validators";

const env = parseNodeEnv(process.env);

// BullMQ requires `maxRetriesPerRequest: null` on the connection it's given.
export function createQueueConnection(): Redis {
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
}
