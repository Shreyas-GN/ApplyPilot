# ApplyFocus — API Design

REST over HTTPS, JSON, versioned under `/api/v1`. OpenAPI spec is the source of truth once
one is generated; this document is kept in sync with the actual NestJS controllers.

> **Phase 1 status:** §1–3 (Auth, Profile, Resumes) are implemented and tested
> (`apps/api/src/modules/{auth,profile,resumes}`). §4 onward describe the Phase 0 design
> for later phases and are **not implemented** — nothing in this file past §3 exists yet.

## 1. Auth

All under `/api/v1/auth`. Access tokens are short-lived JWTs returned in the response
body; refresh tokens are opaque, rotated on every use, and carried in an `httpOnly`,
`Secure` (in production), `SameSite=Strict` cookie scoped to `/api/v1/auth` — never
exposed to JavaScript. See `AuthController`/`AuthService` for the full implementation.

- `POST /auth/register` `{ email, password }` → `201 { user, tokens }` + sets the refresh
  cookie. Also creates an empty `profiles` row and sends a verification email.
- `POST /auth/login` `{ email, password }` → `200 { user, tokens }` + refresh cookie.
  Identical `401` for "wrong password" and "no such account" — no email-enumeration signal.
- `POST /auth/logout` → `204`, revokes the refresh token, clears the cookie.
- `POST /auth/refresh` → `200 { tokens }` + a **new** rotated refresh cookie. Reusing an
  already-rotated-away refresh token revokes the entire session (theft/replay response) —
  see `AuthService.refresh`.
- `POST /auth/forgot-password` `{ email }` → `202`, always, regardless of whether the
  account exists (no enumeration signal). Sends a reset email when it does.
- `POST /auth/reset-password` `{ token, password }` → `204`. Revokes every existing
  refresh token for the account.
- `POST /auth/verify-email` `{ token }` → `204`.
- `POST /auth/resend-verification` *(protected)* → `202`. Added beyond the original
  spec's endpoint list — a "resend" action needs its own endpoint distinct from
  `forgot-password`, which sends a different email entirely.
- `GET /auth/me` *(protected)* → `200 { id, email, emailVerified, createdAt }`.

Rate limiting: `@nestjs/throttler`, tighter per-route limits on `register` (5/min),
`forgot-password` (5/min), `reset-password` (5/min), `resend-verification` (5/min),
`login`/`refresh`/`verify-email` (10–20/min), plus a global 120/min default. Passwords are
hashed with Argon2id (`argon2` package, default cost parameters).

## 2. Profile

All *(protected)*, all under `/api/v1/profile`, always scoped to the caller's own token —
there is no `:userId` path param anywhere in this module, which is the actual mechanism
behind cross-user isolation (see `ProfileService`, covered by integration tests in
`apps/api/test/app.e2e-spec.ts`).

- `GET /profile` → the full `ProfileDto` (basic info + all five list sections +
  `completionPercent`, computed on read, not stored).
- `PATCH /profile` — basic info fields only (name, phone, location, links, headline,
  summary, years of experience, employment status).
- `PUT /profile/experience` / `/education` / `/skills` / `/projects` / `/certifications`
  — **full-replace** semantics: the given array becomes the complete set for that section.
  Every entry saved through these endpoints is stamped `source: "user"` — `source: "ai"`
  only ever comes from the resume-confirm flow (§3). `skills` additionally dedupes
  case-insensitively.
- `PUT /profile/preferences` — job-search preference fields.

All list-replace bodies are validated with the shared Zod schemas in
`packages/validators/src/profile.ts` (reused by the frontend for client-side validation
too), via a `ZodValidationPipe` bound to the `@Body()` parameter specifically — **not** a
method-level `@UsePipes()`, which would also re-run the schema over the `@CurrentUser()`
parameter and silently corrupt it (hit this exact bug during Phase 1 development; see the
comment in `ProfileController`).

## 3. Resumes

All *(protected)*, all under `/api/v1/resumes`, same "scoped to caller's own token, 404 (not
403) on another user's resume" isolation pattern as Profile.

- `POST /resumes/upload` *(multipart, field `file`, optional `versionLabel`)* → `201
  ResumeDto`. Validates extension + declared MIME type + **actual file-content magic
  bytes** (defense against a spoofed `Content-Type`), max 10MB. Stores the file via the
  storage abstraction (`STORAGE_PROVIDER=local|s3`), creates the `resumes` +
  `resume_parsing_jobs` rows, and enqueues a BullMQ job for `apps/workers` to pick up. The
  first resume a user uploads is automatically marked primary.
- `GET /resumes` → `ResumeDto[]`, newest first.
- `GET /resumes/:id` → `ResumeDto`.
- `GET /resumes/:id/status` → `{ processingStatus, parsingJobStatus, error }` — meant for
  polling while a resume is still `uploaded`/`extracting`/`extracted`/`parsing`.
- `GET /resumes/:id/download-url` → `{ url, expiresInSeconds }`. **Not in the original
  endpoint list** — added because "generate secure, short-lived download URLs" needs
  somewhere to live. The URL itself requires no `Authorization` header (same trust model
  as an S3 presigned URL — local-provider URLs are HMAC-signed with a short expiry instead;
  see `SYSTEM_ARCHITECTURE.md`).
- `GET /resumes/:id/parsed-data` → `ResumeParsedDataDto`. `404` until parsing has produced
  something.
- `PATCH /resumes/:id/parsed-data` — the user's corrections, replacing the stored
  structured data wholesale (not a per-field patch); validated against the strict
  `resumeParsedDataSchema` (`packages/validators`). `400` if the resume has already been
  confirmed (edit the profile directly after that point instead).
- `POST /resumes/:id/confirm` → `204`. Idempotent. Copies the (possibly user-corrected)
  structured data into the relational profile tables — **full replace** of
  experience/education/skills/projects/certifications, not an accumulating merge, and
  **personal-info fields only overwrite when present** in the parsed data (never blanks
  out an existing profile field). Each copied entry keeps its own `source`/`confidence`
  from the parsed data, so AI-sourced fields stay visibly AI-sourced even after
  confirmation — manually re-editing them later through §2's endpoints is what converts
  them to `source: "user"`.
- `PATCH /resumes/:id/primary` → `ResumeDto`. Unsets any other primary resume for the
  user in the same transaction.
- `DELETE /resumes/:id` → `204`. Deletes the DB row and the underlying storage object.

---

## 4. Jobs & Matching *(not implemented — Phase 2+)*

- `GET /api/v1/jobs/feed?filters=...` — paginated, ranked by match score
- `GET /api/v1/jobs/:id`
- `GET /api/v1/jobs/search?q=...`
- `POST /api/v1/matches/:id/save`
- `POST /api/v1/matches/:id/dismiss`

## 5. Tailoring *(not implemented — Phase 2+; async AI generation)*

- `POST /api/v1/tailoring/resume` `{ jobId }` → `202 { tailoringJobId }`
- `POST /api/v1/tailoring/cover-letter` `{ jobId, tone }` → `202 { tailoringJobId }`
- `GET /api/v1/tailoring/:tailoringJobId` — poll result; on completion, returns the
  generated content plus a diff against the base resume/template

Long-running AI generation always follows the `202` + poll (or webhook, for
server-to-server integrations later) pattern — never a synchronous blocking call on these
endpoints. (Phase 1's resume-parsing pipeline already follows this shape: upload returns
immediately, `GET /resumes/:id/status` is the poll.)

## 6. Extension protocol *(not implemented — Phase 6)*

The extension never receives raw user credentials for third-party sites and never sends
any to our backend. Its contract with the backend is:

- `POST /api/v1/extension/pair` — called once, while the user is logged into the web app
  in the same browser; issues a scoped device token (`scopes: ["sync", "apply"]`)
- `GET /api/v1/extension/sync` — pull: pending co-pilot review items and (Phase 4+)
  auto-pilot-approved jobs ready to execute, each bundled with the tailored
  resume/cover-letter content and a field-mapping hint set
- `POST /api/v1/extension/report` — push: per-field fill results and the final
  submit outcome for a given `applicationId`; writes to `application_events`
- `DELETE /api/v1/extension/pair` — revoke (also triggerable from the web app's
  Compliance Center, which calls the same underlying revoke path)

Device tokens are scoped so that even a compromised extension token cannot read billing
data or change account settings — only sync/report within the applications it was handed.

## 7. Applications & Tracker *(not implemented — Phase 3+)*

- `GET /api/v1/applications?status=...`
- `GET /api/v1/applications/:id` — includes full `application_events` audit trail
- `POST /api/v1/applications` — create (manual "mark as applied" or system-queued)
- `PATCH /api/v1/applications/:id` — status/notes update
- `POST /api/v1/applications/:id/approve` — co-pilot: user approves the reviewed diff;
  idempotency key required to prevent duplicate submission on retry

## 8. Notifications *(not implemented — Phase 4+)*

- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`

## 9. Billing *(not implemented — Phase 7)*

- `GET /api/v1/billing/plans`
- `POST /api/v1/billing/checkout-session`
- `POST /api/v1/billing/webhook` — Stripe webhook receiver (signature-verified)

## 10. Compliance Center *(partially implemented)*

Resume deletion (§3) and the account-level data a user can act on today live under
Profile/Resumes directly; a dedicated Compliance Center surface (export, full account
deletion, plain-language activity log reading from `audit_logs`) is not built yet.

- `GET /api/v1/compliance/activity-log` *(not implemented)*
- `POST /api/v1/compliance/export` *(not implemented)*
- `DELETE /api/v1/compliance/account` *(not implemented)*

## 11. Internal/admin *(not implemented — Phase 5+)*

- `GET/PATCH /api/v1/internal/ats-connectors` — manage the Tier-1/2/3 registry; letting
  ops demote a broken Tier-2 connector without a deploy, per `SYSTEM_ARCHITECTURE.md` §3

## 12. Cross-cutting conventions

- **Errors**: `application/problem+json`-style body `{ type, title, status, detail,
  instance }`, via a global `HttpExceptionFilter` — implemented, applies to every
  endpoint including the ones above that don't exist yet.
- **Validation**: class-validator DTOs for simple flat bodies (auth endpoints); the shared
  Zod schemas in `packages/validators` for anything with nested arrays (profile sections,
  resume parsed data) — reused as-is by the frontend.
- **Idempotency**: `POST /resumes/:id/confirm` is idempotent (confirming twice is a no-op
  the second time). A formal `Idempotency-Key` header convention for Phase 3+'s
  submission-triggering endpoints is still just the Phase 0 design, not built.
- **Rate limiting**: implemented via `@nestjs/throttler`, see §1. Per-endpoint overrides
  on auth; a global default elsewhere.
- **Pagination**: not yet needed (no list endpoint returns enough rows to require it in
  Phase 1); cursor-based (`?cursor=...&limit=...`) remains the plan for Phase 2+'s job feed.
- **Webhooks out** (Phase 5+, not MVP): `application.status_changed`, `match.created`,
  signed with a per-integration secret.
