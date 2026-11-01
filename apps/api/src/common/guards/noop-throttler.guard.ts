import { Injectable, type CanActivate } from "@nestjs/common";

// Swapped in for the real ThrottlerGuard only when NODE_ENV=test (see
// app.module.ts) — the automated test suite deliberately exercises
// registration/login/etc. far faster than any real client would, which
// would otherwise trip the same rate limits that protect production. Rate
// limiting itself is still covered structurally (the real guard is used
// everywhere else); this just keeps it from being an incidental obstacle
// to unrelated test assertions.
@Injectable()
export class NoopThrottlerGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
