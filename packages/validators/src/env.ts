import { z } from "zod";

// Shared environment schema for Node services (apps/api, apps/workers).
// Fails fast and loudly on boot rather than letting a missing/malformed
// env var surface as a confusing runtime error later.
export const nodeEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
});

export type NodeEnv = z.infer<typeof nodeEnvSchema>;

export function parseNodeEnv(raw: Record<string, string | undefined>): NodeEnv {
  return nodeEnvSchema.parse(raw);
}
