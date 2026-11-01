# ApplyPilot — System Architecture

## 1. High-level diagram

```
                         ┌──────────────────────────┐
                         │   User's Browser          │
                         │  ┌──────────────────────┐ │
                         │  │ ApplyPilot Extension │ │  <- runs IN the user's own
                         │  │ (Manifest V3, TS)    │ │     authenticated session.
                         │  │  - content script     │ │     No ATS credentials ever
                         │  │  - service worker      │ │     leave the browser.
                         │  │  - popup/review UI     │ │
                         │  └──────────┬────────────┘ │
                         └─────────────┼──────────────┘
                                       │ HTTPS (scoped device token)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              ApplyPilot Backend                           │
│                                                                            │
│  API Gateway / BFF  (NestJS, TypeScript)                                  │
│      │                                                                     │
│      ├── Auth Service            (OAuth2/JWT, device token issuance)      │
│      ├── Profile Service         (resume storage/parsing orchestration)   │
│      ├── Job Service              (feed, search, match retrieval)         │
│      ├── Application Service     (tracker, audit trail, extension sync)  │
│      ├── Billing Service          (Stripe integration)                    │
│      │                                                                     │
│      ▼                                                                     │
│  Message Queue (Redis Streams / BullMQ)                                   │
│      │                                                                     │
│      ├── Job Ingestion Workers   (Tier-1 native API pollers: Greenhouse,  │
│      │                            Lever; Tier-2 generic crawlers, later)  │
│      ├── Matching Worker          (embeddings + scoring, Python)          │
│      ├── Tailoring Worker         (LLM calls: resume/cover-letter, Python)│
│      └── Notification Worker                                              │
│                                                                            │
│  Data layer:                                                              │
│      ├── PostgreSQL (+pgvector)  — system of record + embeddings          │
│      ├── Redis                   — cache, queue broker                    │
│      └── Object storage (S3-compatible) — resume/cover-letter files       │
│                                                                            │
│  AI/LLM layer (provider-abstracted; default: Claude via Anthropic API)    │
└──────────────────────────────────────────────────────────────────────────┘
                                       ▲
                                       │ public job board APIs
                         ┌─────────────┴──────────────┐
                         │ Greenhouse / Lever / etc.    │
                         └───────────────────────────────┘
```

## 2. Decision: where automation executes (confirmed with product owner)

**Chosen: client-side, inside the user's own browser, via the extension.** No headless
browser farm; no server-side custody of ATS/job-board credentials or session cookies.

Rationale:
- Eliminates an entire category of security liability (we are never the system of record
  for a user's LinkedIn/Workday/etc. password or session).
- Automated actions genuinely originate from the user's own authenticated session, which
  is materially different — practically and in ToS terms — from a server farm acting on
  bulk accounts.
- Matches the one point of rough consensus in `REVERSE_ENGINEERING.md` (extension-based
  distribution), though we arrived at it independently for compliance reasons, not by
  copying it.

Trade-off accepted: no "apply while the user is asleep/offline" capability in MVP. The
backend instead pre-computes everything it can (matches, tailored drafts) so that when the
user *is* browsing, the extension's job is just execution, not decisioning. An opt-in,
separately-consented server-side mode is deferred — see `MVP_ROADMAP.md` Phase 5+ — and
would require its own security review before being built, not a default extension of this
architecture.

## 3. Decision: ATS integration strategy (confirmed with product owner)

**Chosen: API-first with tiered, labeled fallback.**

| Tier | Mechanism | Examples | User-facing label |
|---|---|---|---|
| 1 — Native | Official job board / application API | Greenhouse Job Board API, Lever Postings API | "Native integration" |
| 2 — Best-effort | Generic DOM form-detection + fill, executed only inside the user's own authenticated session via the extension | Workday, iCIMS, generic company career pages | "Best-effort autofill" |
| 3 — Unsupported | None — link out only | Anything not recognized | "Manual apply only" |

Rules:
- We never scrape or submit in bulk/anonymously against a site we have no account
  relationship with; Tier-2 automation only ever acts through the user's own session.
- We respect `robots.txt` and published ToS for ingestion; Tier-1 is preferred specifically
  because it's the only tier with an actual contractual/API relationship.
- The ATS connector registry (`ats_connectors` table, see `DATABASE_SCHEMA.md`) is the
  single source of truth for which tier a given ATS is in — this is config, not code, so
  a connector can be demoted (e.g. if a site changes its DOM and breaks silently) without
  a deploy.

## 4. Services & tech stack

| Layer | Choice | Why |
|---|---|---|
| Web app | Next.js (React, TypeScript) | SSR for the marketing/landing surface, SPA-like app experience for the product |
| Browser extension | Manifest V3, TypeScript, shared types with backend | Single language across extension + BFF reduces drift in the request/response contracts that matter most (application field mapping) |
| API / BFF | NestJS (Node.js, TypeScript) | Structured, testable, good fit for a modular-monolith-first approach |
| AI/ML workers | Python (FastAPI internal service, or plain workers) | Python's ML/NLP ecosystem (embeddings, parsing libraries) is the pragmatic choice for this slice only |
| Primary datastore | PostgreSQL + `pgvector` | One datastore for relational + embedding search in MVP; avoids standing up a separate vector DB before it's justified |
| Cache / queue | Redis (+ BullMQ for Node workers) | Simple, well-understood, sufficient at MVP scale |
| Object storage | S3-compatible (e.g. AWS S3) | Resume/cover-letter files, versioned |
| LLM provider | Anthropic Claude, behind a provider-abstraction interface | Default to the most capable current Claude model per product guidance; abstraction allows swapping without rewriting call sites |
| Background jobs | Queue-backed workers (ingestion, matching, tailoring, notifications) | Keeps request/response paths fast; AI calls and crawling never block user-facing requests |
| Infra | Containerized (Docker); managed container platform (e.g. ECS Fargate) over Kubernetes for MVP | Avoids orchestration overhead before scale justifies it |
| CI/CD | GitHub Actions → build/test/deploy | Standard, matches GitHub-hosted repo |
| IaC | Terraform | Reproducible environments |

This is a **modular monolith** at MVP (one deployable API, internally organized by
service/module boundary) with **separate worker processes** for anything AI/queue-driven —
not microservices from day one. Splitting services further is a Phase 5+ concern if/when
team size or load actually demands it.

## 5. Multi-tenancy

Single Postgres database, `user_id`-scoped rows throughout, enforced via application-layer
authorization plus Postgres Row-Level Security as a defense-in-depth backstop on the
tables holding PII (`profiles`, `resumes`, `applications`, `application_events`).

## 6. Security

- No server-side storage of third-party ATS/job-board credentials or session cookies —
  structurally impossible by design (see §2), not just a policy.
- Extension device tokens are scoped (apply/sync-only; cannot read billing or trigger
  account changes) and individually revocable.
- Resumes and profile PII encrypted at rest (KMS-managed keys); TLS everywhere in transit.
- Every automated action and every AI-generated artifact is written to an append-only
  audit trail (`application_events`) — required for user trust and for resolving disputes
  about what was submitted on a user's behalf.
- LLM prompts are built with PII minimization: only the fields actually needed for the
  task (e.g. relevant work history for tailoring) are included, not the full raw profile.
- Rate limiting and idempotency keys on submission-triggering endpoints to prevent
  duplicate applications from retries.
- Standard web hardening: CSRF protection, strict CSP, dependency scanning in CI.

## 7. Observability

- Structured logging + distributed tracing across API and workers.
- Per-application audit trail is a product feature, not just an ops tool (surfaced in the
  Compliance Center, see `UI_UX.md`).
- Error tracking with alerting on automation failure-rate spikes (signals an ATS changed
  its form and a Tier-2 connector needs attention).
- Cost/usage metrics per LLM call, attributable to user tier, for margin visibility.

## 8. Compliance notes

- GDPR/CCPA: data export and deletion are first-class product features (§4.7 in
  `PRODUCT_REQUIREMENTS.md`), not support-ticket-only processes.
- Data retention: resumes/profile data retained while account is active; deleted (not just
  soft-deleted) within a defined window after account deletion; audit logs retained in an
  anonymized form only as long as required for abuse/security investigation.
- This architecture does not, by itself, resolve every ToS question for every Tier-2 site
  we might automate against — that is a per-connector legal review item, tracked via the
  `ats_connectors` registry, not a one-time architectural sign-off.
