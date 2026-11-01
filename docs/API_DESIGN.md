# ApplyPilot — API Design

REST over HTTPS, JSON, versioned under `/api/v1`. OpenAPI spec is the source of truth once
implementation starts; this document defines the shape and contracts.

## 1. Auth

- `POST /api/v1/auth/signup` — email+password signup
- `POST /api/v1/auth/login` — returns short-lived access token + refresh token
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/oauth/callback/:provider`

Web app uses standard access/refresh JWTs. The **extension** uses a separate, narrowly
scoped **device token** issued only after the user is already logged in on the web app —
see §5.

## 2. Profile

- `GET /api/v1/profile`
- `PATCH /api/v1/profile` — edit parsed fields, preferences
- `POST /api/v1/profile/resumes` — upload resume (multipart) → returns `202` with a job id
  while parsing runs async
- `GET /api/v1/profile/resumes` — list versions
- `PATCH /api/v1/profile/resumes/:id` — set as primary, rename version label
- `GET /api/v1/jobs/parse-status/:jobId` — poll resume-parsing job status

## 3. Jobs & Matching

- `GET /api/v1/jobs/feed?filters=...` — paginated, ranked by match score
- `GET /api/v1/jobs/:id`
- `GET /api/v1/jobs/search?q=...`
- `POST /api/v1/matches/:id/save`
- `POST /api/v1/matches/:id/dismiss`

## 4. Tailoring (async AI generation)

- `POST /api/v1/tailoring/resume` `{ jobId }` → `202 { tailoringJobId }`
- `POST /api/v1/tailoring/cover-letter` `{ jobId, tone }` → `202 { tailoringJobId }`
- `GET /api/v1/tailoring/:tailoringJobId` — poll result; on completion, returns the
  generated content plus a diff against the base resume/template

Long-running AI generation always follows the `202` + poll (or webhook, for
server-to-server integrations later) pattern — never a synchronous blocking call on these
endpoints.

## 5. Extension protocol

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

## 6. Applications & Tracker

- `GET /api/v1/applications?status=...`
- `GET /api/v1/applications/:id` — includes full `application_events` audit trail
- `POST /api/v1/applications` — create (manual "mark as applied" or system-queued)
- `PATCH /api/v1/applications/:id` — status/notes update
- `POST /api/v1/applications/:id/approve` — co-pilot: user approves the reviewed diff;
  idempotency key required to prevent duplicate submission on retry

## 7. Notifications

- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`

## 8. Billing

- `GET /api/v1/billing/plans`
- `POST /api/v1/billing/checkout-session`
- `POST /api/v1/billing/webhook` — Stripe webhook receiver (signature-verified)

## 9. Compliance Center

- `GET /api/v1/compliance/activity-log` — plain-language feed backing the UI described
  in `UI_UX.md` §3, built from `application_events` + `consent_logs`
- `POST /api/v1/compliance/export` → `202`, async export job, delivered as a downloadable
  archive
- `DELETE /api/v1/compliance/account` — initiates cascading deletion per
  `DATABASE_SCHEMA.md` §3

## 10. Internal/admin

- `GET/PATCH /api/v1/internal/ats-connectors` — manage the Tier-1/2/3 registry; letting
  ops demote a broken Tier-2 connector without a deploy, per `SYSTEM_ARCHITECTURE.md` §3

## 11. Cross-cutting conventions

- **Errors**: `application/problem+json`-style body `{ type, title, status, detail,
  instance }`.
- **Idempotency**: all state-mutating endpoints that trigger a real-world side effect
  (submit, delete) require an `Idempotency-Key` header.
- **Rate limiting**: per-user and per-endpoint, with stricter limits on
  submission-triggering endpoints than read endpoints.
- **Pagination**: cursor-based (`?cursor=...&limit=...`) on all list endpoints.
- **Webhooks out** (Phase 5+, not MVP): `application.status_changed`, `match.created`,
  signed with a per-integration secret.
