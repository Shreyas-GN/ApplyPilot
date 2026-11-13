# ApplyFocus — Phased MVP Roadmap

> **Status: Phase 0 and Phase 1 complete** (see §Phase 1 below for what shipped and what
> changed from the original plan). Phases 2+ are still the Phase 0-era design, not started.

## Phase 0 — Foundations ✅ complete
**Goal:** a buildable, deployable skeleton before any product feature.
- Repo scaffolding: Next.js web app, NestJS API, shared TypeScript types package,
  extension project skeleton (Manifest V3), Python AI service.
- Postgres schema migration tooling; base `users`/`profiles` tables.
- CI (lint/test/build) + Docker Compose for local dev.
- Exit criteria met: all apps build, typecheck, lint, and the API's `/health` endpoint
  confirms real Postgres + Redis connectivity.

## Phase 1 — Core Product: Auth, Profile, Resumes ✅ complete
**Goal, as actually scoped for this phase:** authentication, a full candidate profile, and
resume upload/parsing/review — deliberately narrower than Phase 0's original Phase 1
description (which bundled in job discovery + matching). That work moved to Phase 2 below,
since shipping auth/profile/resumes first — without touching job ingestion or matching at
all — kept this phase's surface area reviewable and let the resume-parsing pipeline (the
riskiest new piece: an async worker, an AI service call, and the no-fabrication guardrail)
ship and get tested in isolation.

**Shipped:**
- Full auth: register, login, logout, refresh-token rotation (with theft/reuse detection —
  reusing a rotated-away token revokes the whole session), Argon2id password hashing,
  password reset, email verification (+ resend), per-route rate limiting, an audit log of
  every security-relevant event.
- Candidate profile: personal info, professional info, and job preferences, plus five
  structured sections (work experience, education, skills, projects, certifications) with
  full CRUD and user-vs-AI-sourced provenance tracking on every entry.
- Resume management: upload (PDF/DOCX, validated by extension + declared MIME type +
  actual file-content magic bytes, not just the filename), an object-storage abstraction
  (local disk for dev, S3-compatible for production) with short-lived signed download
  URLs, multi-version support with a primary resume, and deletion that also cleans up the
  stored file.
- Resume parsing pipeline: deterministic PDF/DOCX text extraction in `apps/workers`
  (`pdf-parse` / `mammoth`) → `services/ai`'s `/parse-resume` endpoint (a deterministic
  regex-based mock provider by default; an optional Claude-backed provider when
  `ANTHROPIC_API_KEY` is set) → strict Zod-schema validation of whatever comes back before
  it's trusted anywhere → stored for review.
- Parsing review & confirm: the user sees every extracted field (with confidence
  indicators and an "AI-suggested" badge), can correct or add entries, and nothing reaches
  their profile until they explicitly confirm — confirming replaces the corresponding
  profile sections wholesale (not an accumulating merge across re-uploads) while
  preserving each entry's own source/confidence.
- Frontend: landing, signup, login, forgot/reset password, email verification, onboarding,
  dashboard, profile editor, resume manager, parsing review, settings — all built, and all
  manually verified against the real running stack with Playwright (not just "it builds").
- Tests: 35 backend tests (unit + real-Postgres/Redis integration — registration/login,
  invalid credentials, authorization, cross-user isolation, resume upload validation and
  ownership) and 15 frontend component tests (auth forms, profile editing, resume upload
  validation, parsing-review corrections).

**Deliberately not in this phase** (unchanged from the Phase 0 plan): job discovery,
matching, tailoring, the browser extension's actual automation, billing.

## Phase 2 — Job Discovery, Matching & AI Tailoring
**Goal:** the Phase 0 plan's original Phase 1 (job discovery/matching) and Phase 2
(tailoring), combined — both now come after Phase 1's profile/resume foundation exists to
build on, which is a cleaner dependency order than the original plan had.
- Job ingestion from Tier-1 sources (Greenhouse, Lever public APIs) + feed UI.
- Match scoring + rationale (Job Matching Agent, grounded in the now-real profile data).
- Manual application tracker (user logs applications themselves; no automation yet).
- Resume Tailoring Agent + diff UI; Cover Letter Generation Agent.
- No-fabrication guardrail tested against adversarial prompts (resume content that could
  tempt the model to over-claim) — the same principle already enforced in Phase 1's
  resume-parsing pipeline, extended to tailoring.
- Exit criteria: a user can go from their Phase 1 profile to a ranked, explainable job
  feed, generate a tailored resume/cover letter per posting, and track applications they
  make manually.

## Phase 3 — Browser Extension Co-Pilot
**Goal:** the actual automation differentiator, shipped behind the compliance posture
decided in `SYSTEM_ARCHITECTURE.md` §2–3.
- Extension pairing flow (scoped device tokens, no ATS credentials ever requested).
- Tier-1 native-API submission path (Greenhouse/Lever).
- Tier-2 best-effort form-mapping + fill for one or two additional common ATS platforms,
  executed only in-session via the extension.
- Review-before-submit diff screen (co-pilot mode only — this phase does not ship
  auto-pilot).
- `application_events` audit trail + Compliance Center activity log.
- Exit criteria: a user can have ApplyFocus autofill and, after their explicit review and
  click, submit an application on a Tier-1 or Tier-2 site, with a complete audit trail.

## Phase 4 — Auto-Pilot & Analytics
**Goal:** hands-off mode, opt-in, and the trust/measurement layer around it.
- Auto-pilot criteria setup (min score, daily/weekly caps, exclusions) + disclosure flow.
- Confidence-threshold-gated automatic submission; below-threshold routes to co-pilot
  queue (never silently dropped or force-submitted).
- Kill switch.
- Notifications (new match, status change, automation failure).
- User-facing analytics (application funnel).
- Exit criteria: a consenting user can run auto-pilot for a week with caps respected,
  a working kill switch, and zero submissions below their set confidence threshold.

## Phase 5 — Scale & Expand
**Goal:** broaden coverage and revisit the deferred, higher-liability options explicitly.
- Additional Tier-2 ATS connectors, each going through the per-connector legal/compliance
  review flagged in `SYSTEM_ARCHITECTURE.md` §8 before being enabled.
- Evaluate (separately, not as a default extension of existing architecture) a
  consent-gated, server-side "apply while offline" mode — would require its own security
  design review given the credential-custody trade-off accepted against in Phase 0–4.
- Team/enterprise features, interview prep, outreach tracking — all currently out of
  scope per `PRODUCT_REQUIREMENTS.md` §6; revisit based on Phase 1–4 retention/usage data.

## Cross-phase, always-on workstreams
- Security review on every new ATS connector before it goes live.
- Privacy/compliance review (GDPR/CCPA) tracks each phase's new data flows.
- Accessibility (WCAG 2.1 AA) checked per shipped screen, not retrofitted at the end.
