# ApplyPilot — AI Agents & Automation Workflows

These are structured AI-backed pipelines, not unconstrained autonomous agents. Each has a
narrow responsibility, explicit inputs/outputs, and guardrails (§6). Default LLM provider
is Anthropic Claude (current most-capable model) behind a provider-abstraction interface,
so the implementation can swap providers without touching call sites.

## 1. Resume Parser Agent
- **Input**: uploaded resume file (PDF/DOCX).
- **Process**: deterministic text/layout extraction first; LLM pass to structure into
  `{ contact, experience[], education[], skills[] }`; low-confidence fields flagged rather
  than guessed.
- **Output**: `profiles.parsed_*` fields + a confidence map used by the UI to prompt the
  user to confirm uncertain fields.
- **Runs**: backend worker, triggered on upload.

## 2. Job Matching Agent
- **Input**: user profile + preferences, candidate job postings (from ingestion workers).
- **Process**: embed job description + user profile (shared embedding space); combine
  vector similarity with rule-based filters (location, seniority keywords, excluded
  companies/industries, salary floor if posting discloses it); generate a short
  human-readable rationale **strictly grounded in fields actually present in the user's
  profile and the posting text** (no inferred claims about the user not present in their
  own data).
- **Output**: `matches` row with `score` + `rationale`.
- **Runs**: backend worker, triggered on new ingested postings and on profile updates.

## 3. Resume Tailoring Agent
- **Input**: base resume (structured), target job posting text.
- **Process**: reorder/emphasize/rephrase existing bullets toward the posting's language;
  surface ATS keyword overlap. **Hard constraint: may not introduce an employer, title,
  skill, certification, or duration of experience not present in the user's base
  resume/profile.** Any rephrasing must remain a truthful paraphrase of source content.
- **Output**: tailored resume variant + a diff against the base resume for user review.
- **Runs**: on-demand (user-triggered) or pre-computed for high-score matches to speed up
  the co-pilot flow.

## 4. Cover Letter Generation Agent
- **Input**: profile, target posting, selected tone.
- **Process**: draft grounded in profile + posting; same no-fabrication constraint as §3.
- **Output**: draft cover letter, editable before use.

## 5. Form-Mapping Agent (executes inside the browser extension)
- **Input**: detected ATS form DOM structure, tailored resume/profile data.
- **Process**:
  - Tier-1 (native API): structured field mapping is largely deterministic — the API
    schema is known in advance via the `ats_connectors` config.
  - Tier-2 (best-effort): LLM-assisted mapping of unlabeled/non-standard form fields to
    profile data; for open-ended questions, drafts an answer **grounded in the user's own
    profile/resume content only** (same no-fabrication rule as §3–4).
  - Produces a per-field confidence score.
- **Output**: a filled-but-not-submitted form state, always surfaced through the
  review-before-submit diff in co-pilot mode. In auto-pilot mode, submission proceeds only
  if the *overall* confidence (mapping + tailoring) clears the user's threshold; anything
  below threshold routes to the co-pilot queue instead of being forced through or dropped.
- **Runs**: client-side, in the user's browser, inside the extension — never on backend
  infrastructure holding the user's ATS session. See `SYSTEM_ARCHITECTURE.md` §2.

## 6. Application Orchestrator (deterministic, not AI)
- Coordinates: which tier a posting's ATS falls in, queueing, retry/backoff policy,
  per-site rate limits, and writing every step to `application_events`.
- Responsible for the "degrade gracefully" rule: a failure here always surfaces a
  human-actionable state, never a silent drop or an infinite retry loop against a
  third-party site.

## 7. Guardrails (apply across all agents)

1. **No fabrication.** Every AI-generated claim about the user (skills, experience,
   answers to screening questions) must be traceable to something the user actually
   provided. This is enforced both as a prompt-level instruction and, where feasible, as
   a post-generation check against the source profile.
2. **Human-in-the-loop by default.** Co-pilot (review-before-submit) is the default
   experience; auto-pilot is opt-in, capped, and carries an always-available kill switch
   (`PRODUCT_REQUIREMENTS.md` principle 4).
3. **Transparency.** Every AI-generated artifact and every automated action is logged to
   `application_events` and surfaced in the Compliance Center — not just kept in
   backend-only logs.
4. **PII minimization in prompts.** Only the profile fields actually relevant to a given
   generation task are included in the LLM context; the full raw profile is not dumped
   into every prompt.
5. **Provider abstraction.** No call site depends on a specific LLM vendor's SDK directly;
   all generation goes through an internal interface so the provider/model can change.
6. **Cost/rate controls.** Per-user/per-tier token budgets and rate limits on generation
   endpoints, to keep unit economics predictable as usage scales.
7. **Confidence thresholds are configurable, not hardcoded**, so auto-pilot behavior can
   be tuned (or tightened in response to a failure spike) without a code change.

## 8. What is explicitly not an "agent" here

There is no single end-to-end autonomous agent that decides on its own to browse the web,
find jobs, and apply with no per-step accountability. The system is a set of narrow,
auditable pipelines coordinated by a deterministic orchestrator — a deliberate choice so
that every action remains attributable and explainable, per the product principles in
`PRODUCT_REQUIREMENTS.md`.
