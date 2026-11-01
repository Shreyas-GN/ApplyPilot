// Cross-app DTO-level types. These describe API request/response shapes
// (see docs/API_DESIGN.md) — not Prisma models directly, so the API is free to
// reshape its persistence layer without breaking consumers.

export interface HealthCheckResponse {
  status: "ok" | "degraded";
  checks: {
    database: "ok" | "error";
    redis: "ok" | "error";
  };
  version: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
}
