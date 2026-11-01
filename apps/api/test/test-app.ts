import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";

// Integration tests run against the REAL local Postgres (a dedicated
// `applypilot_test` database — never applypilot_dev) and REAL local Redis.
// Mirrors the middleware/pipe setup in src/main.ts, which createNestApplication()
// alone does not apply.
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(cookieParser());
  await app.init();
  return app;
}

export function extractRefreshCookie(setCookieHeader: string | string[] | undefined): string {
  const values = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : [];
  const raw = values.find((c) => c.startsWith("refresh_token="));
  if (!raw) throw new Error("No refresh_token cookie in response");
  return raw.split(";")[0] ?? "";
}
