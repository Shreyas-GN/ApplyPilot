import { z } from "zod";

// Shared environment schema for Node services (apps/api, apps/workers).
// Fails fast and loudly on boot rather than letting a missing/malformed
// env var surface as a confusing runtime error later. Secrets have no
// defaults; everything with a safe local-dev default gets one, so a fresh
// clone works out of the box with just DATABASE_URL/REDIS_URL set.
export const nodeEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  // Auth (apps/api)
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  APP_URL: z.string().url().default("http://localhost:3000"),

  // Email provider (apps/api) — see docs for the full env var list.
  EMAIL_PROVIDER: z.enum(["console", "smtp"]).default("console"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z.coerce.boolean().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // Object storage (apps/api writes/reads, apps/workers reads). The
  // default is relative to *each app's own directory*, not the process
  // cwd at large — apps/api and apps/workers are both exactly two levels
  // under the repo root (apps/<name>), so "../../.local-storage" resolves
  // to the same absolute path from either, which matters since each is
  // normally launched with its own directory as cwd (`pnpm --filter ... dev`).
  // Set an absolute path instead if that assumption doesn't hold for your setup.
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  LOCAL_STORAGE_DIR: z.string().default("../../.local-storage"),
  // Used to build signed local-storage download URLs that point back at
  // this API (irrelevant when STORAGE_PROVIDER=s3, which signs real S3 URLs).
  API_BASE_URL: z.string().url().default("http://localhost:3001/api/v1"),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().optional(),

  // AI service (apps/workers calls services/ai over HTTP)
  AI_SERVICE_URL: z.string().url().default("http://localhost:8000"),
});

export type NodeEnv = z.infer<typeof nodeEnvSchema>;

const checkedNodeEnvSchema = nodeEnvSchema.superRefine((env, ctx) => {
  if (env.EMAIL_PROVIDER === "smtp") {
    for (const key of ["SMTP_HOST", "SMTP_PORT", "SMTP_FROM"] as const) {
      if (!env[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required when EMAIL_PROVIDER=smtp`,
        });
      }
    }
  }
  if (env.STORAGE_PROVIDER === "s3") {
    for (const key of ["S3_BUCKET", "S3_REGION"] as const) {
      if (!env[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required when STORAGE_PROVIDER=s3`,
        });
      }
    }
  }
});

export function parseNodeEnv(raw: Record<string, string | undefined>): NodeEnv {
  return checkedNodeEnvSchema.parse(raw);
}
