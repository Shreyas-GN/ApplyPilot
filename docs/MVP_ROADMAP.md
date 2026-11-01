# ApplyPilot — Phased MVP Roadmap

No coding has started — this is the planning sequence for when it does.

## Phase 0 — Foundations
**Goal:** a buildable, deployable skeleton before any product feature.
- Repo scaffolding: Next.js web app, NestJS API, shared TypeScript types package,
  extension project skeleton (Manifest V3).
- Postgres schema migration tooling; base `users`/`profiles` tables.
- Auth (email+password + one OAuth provider).
- CI (lint/test/build) + basic CD to a staging environment.
- Exit criteria: a user can sign up and log in, end to end, in a deployed staging env.

## Phase 1 — MVP Core (no automation yet)
**Goal:** deliver real value — discovery + tracking — before touching any
submission automation, which is the highest-risk surface.
- Resume upload + parsing (Resume Parser Agent, §1 of `AI_AGENTS.md`).
- Profile editor + preferences.
- Job ingestion from Tier-1 sources (Greenhouse, Lever public APIs) + feed UI.
- Match scoring + rationale (Job Matching Agent).
- Manual application tracker (user logs applications themselves; no automation).
- Exit criteria: a user can go from resume upload to a ranked, explainable job feed and
  track applications they make manually.

## Phase 2 — AI Tailoring
**Goal:** add the tailoring value, still with manual submission.
- Resume Tailoring Agent + diff UI.
- Cover Letter Generation Agent.
- No-fabrication guardrail implemented and tested against adversarial prompts (resume
  content that could tempt the model to over-claim).
- Exit criteria: a user can generate a tailored resume/cover letter per posting and use it
  (copy/download) to apply manually, with full confidence nothing was fabricated.

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
- Exit criteria: a user can have ApplyPilot autofill and, after their explicit review and
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
