# ApplyFocus — Feature List

Organized by module. `MVP` = Phase 1–3 of `MVP_ROADMAP.md`. `Later` = Phase 4+.

## 1. Onboarding & Profile
- `MVP` Resume upload (PDF/DOCX) with automatic parsing into structured profile
- `MVP` Manual profile editor (fix parser mistakes, fill gaps)
- `MVP` Job preferences (roles, locations/remote, salary floor, excluded companies/industries)
- `MVP` Multiple resume versions, one marked primary
- `Later` LinkedIn profile import
- `Later` Skills gap suggestions based on target-role market data

## 2. Job Discovery
- `MVP` Aggregated feed from Tier-1 native-API sources (Greenhouse, Lever public job boards)
- `MVP` Match score per posting with plain-language "why this match" rationale
- `MVP` Save / dismiss / filter / keyword search
- `MVP` Per-posting ATS-tier badge (native / best-effort / unsupported)
- `Later` Tier-2 generic career-page ingestion at scale
- `Later` Saved search alerts (email/push on new matching postings)
- `Later` Company insight panel (size, funding stage, glassdoor-style signals) — only if
  sourced from licensed/compliant data, never scraped review sites without permission

## 3. AI Tailoring
- `MVP` Tailored resume variant per posting, with a visible diff vs. base resume
- `MVP` Tailored cover letter per posting with tone selector (formal/conversational/concise)
- `MVP` Source-grounding guardrail: tailoring only reorders/emphasizes/rephrases existing
  profile content — it does not invent experience, titles, or skills
- `Later` Multiple cover-letter drafts to choose from
- `Later` ATS keyword-coverage score against the target posting's text

## 4. Browser Extension — "Apply Assistant"
- `MVP` Install + pair extension to account (no ATS credentials ever requested by us)
- `MVP` Job-page detection + ATS identification
- `MVP` Co-pilot mode: autofill with full review-before-submit diff, including AI-drafted
  answers to open-ended screening questions
- `Later` Auto-pilot mode: hands-off submission above a confidence threshold, with
  user-set daily/weekly caps and an instant kill switch
- `Later` Tier-2 generic form-fill automation for additional ATS platforms beyond
  Greenhouse/Lever
- `MVP` Per-field audit trail of every value the extension wrote

## 5. Application Tracking
- `MVP` Unified tracker (list/kanban) across manual + automated applications
- `MVP` Status pipeline: queued → pending review → submitted → (interview / rejected /
  offer / withdrawn), plus `failed` with reason
- `MVP` Manual notes/status override
- `Later` Email-parsing assist to suggest status updates (opt-in, user's own inbox,
  never automatic without consent)

## 6. Notifications
- `MVP` New high-score match, application submitted, automation failure needing attention
- `Later` Digest emails (daily/weekly summary)

## 7. Settings & Compliance Center
- `MVP` Data export (resumes, profile, application history)
- `MVP` Data deletion (account + cascading data)
- `MVP` Plain-language automation activity log
- `MVP` Extension pairing review/revoke
- `Later` Granular per-ATS automation opt-out

## 8. Analytics (user-facing)
- `Later` Personal funnel: applications → interviews → offers, over time
- `Later` A/B signal on which tailored-resume variant correlates with more callbacks
  (self-reported outcome data only — we cannot observe employer-side outcomes directly)

## 9. Explicitly not planned (see `PRODUCT_REQUIREMENTS.md` §6)
Server-side "apply while offline" automation, recruiter CRM/outreach, interview prep,
salary negotiation tooling, native mobile apps, team/enterprise seats.
