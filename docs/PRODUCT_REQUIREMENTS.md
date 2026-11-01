# ApplyPilot — Product Requirements

> Independent product definition. Informed by the general "AI-assisted job search /
> auto-apply" category (see `REVERSE_ENGINEERING.md` for what we could and couldn't verify
> about Tsenta specifically), but not a copy of any competitor's confirmed design.

## 1. Problem statement

Job seekers spend disproportionate time on low-leverage, repetitive work: finding relevant
postings across dozens of fragmented sources, rewriting the same resume/cover letter per
role, re-entering the same information into every ATS form, and manually tracking where
each application stands. ApplyPilot's job is to remove the repetitive mechanical work while
keeping the user in control of what gets submitted on their behalf and to whom.

## 2. Target personas

| Persona | Situation | Primary need |
|---|---|---|
| **Active searcher** | Unemployed or urgently looking, applying to 20–100+ roles | Volume + speed without losing quality per application |
| **Passive/opportunistic seeker** | Employed, open to the right role | Low-effort discovery, high-precision matching, minimal noise |
| **Career switcher** | Moving industries/functions | Help translating existing experience into a new target role's language, truthfully |
| **New grad / early career** | Limited work history | Help populating ATS forms consistently; cover-letter drafting support |

## 3. Product principles

1. **The user is always the applicant of record.** ApplyPilot assists and automates
   mechanics; it does not apply "as itself" or misrepresent who is applying.
2. **No fabrication.** Any AI-generated resume bullet, cover-letter claim, or screening
   question answer must be grounded in information the user actually provided. See
   `AI_AGENTS.md` §Guardrails.
3. **Transparency over opacity.** Every automated action (what was filled, what was
   submitted, when, to where) is logged and visible to the user — not a black box.
4. **Human-in-the-loop by default.** New users start in review-first ("co-pilot") mode.
   Hands-off ("auto-pilot") mode is opt-in, capped, and revocable at any time via a kill
   switch.
5. **Respect the platforms we touch.** Prefer official APIs; where we fall back to browser
   automation, it runs *in the user's own authenticated session*, never as bulk/anonymous
   scraping against sites we have no relationship with. See `SYSTEM_ARCHITECTURE.md` §2.
6. **We do not custody credentials we don't need.** ApplyPilot's backend does not store
   ATS/job-board passwords or session cookies. See the execution-model decision in
   `SYSTEM_ARCHITECTURE.md` §2.

## 4. Functional requirements, by module

### 4.1 Account & Profile
- FR-1: User can sign up/log in (email+password or OAuth).
- FR-2: User can upload a resume (PDF/DOCX) which is parsed into a structured profile
  (contact info, work history, education, skills).
- FR-3: User can edit the parsed profile directly (correct parser errors).
- FR-4: User can maintain multiple resume versions and mark one primary.
- FR-5: User can set job preferences (target roles, locations/remote, salary floor,
  industries to exclude, companies to exclude).

### 4.2 Job Discovery & Matching
- FR-6: System ingests job postings from Tier-1 native-API sources (e.g. Greenhouse, Lever
  public job boards) and, later, Tier-2 generic sources, deduplicated by company+title+url.
- FR-7: System computes a match score between each posting and the user's profile, with a
  human-readable rationale ("why this match") grounded in actual profile fields.
- FR-8: User can browse/filter/search the feed, save, or dismiss postings.
- FR-9: User can see, per posting, which ATS it uses and which support tier applies
  (native / best-effort / unsupported — see `SYSTEM_ARCHITECTURE.md` §2).

### 4.3 AI Tailoring
- FR-10: User can request a tailored resume variant for a specific posting; system
  highlights what changed vs. the base resume.
- FR-11: User can request a tailored cover letter for a specific posting, with tone options.
- FR-12: All tailored content is editable before use; nothing is submitted without having
  passed through either explicit approval (co-pilot) or a pre-set confidence threshold
  (auto-pilot).

### 4.4 Application Automation (browser extension)
- FR-13: User installs a companion browser extension and pairs it with their account.
- FR-14: On a supported job page, the extension detects the ATS, offers to autofill using
  the tailored resume/profile data, and (Tier-1) can submit via official API or (Tier-2)
  via in-session form automation.
- FR-15: In **co-pilot mode**, every field (including AI-drafted answers to open-ended
  questions) is shown in a review screen before submission; nothing submits without
  explicit user action.
- FR-16: In **auto-pilot mode**, applications matching user-set criteria and above a
  confidence threshold submit automatically, subject to a daily/weekly cap the user sets;
  anything below threshold or on an unsupported ATS routes back to the co-pilot review queue.
- FR-17: User can pause/kill automation instantly from the extension or the web app.
- FR-18: Every automated action writes an audit event (what, where, when, result).

### 4.5 Application Tracking
- FR-19: Every application (manual or automated) appears in a tracker with status
  (queued, pending review, submitted, failed, interview, rejected, offer, withdrawn).
- FR-20: User can manually update status or log notes (e.g. after a recruiter call).
- FR-21: User can filter/search their application history.

### 4.6 Notifications
- FR-22: User is notified of new high-score matches, application status changes, and
  automation failures needing attention.

### 4.7 Settings & Compliance Center
- FR-23: User can view, export, and delete their data (resumes, profile, application
  history) in one place.
- FR-24: User can review and revoke the extension's permissions/pairing at any time.
- FR-25: User can see a plain-language log of what automation has done on their behalf.

## 5. Non-functional requirements

- **NFR-1 Security**: no server-side storage of third-party ATS/job-board credentials;
  encryption at rest for resumes/PII; least-privilege extension token scopes.
- **NFR-2 Privacy/compliance**: GDPR/CCPA-aligned data export & deletion; PII minimization
  when constructing LLM prompts; documented data retention periods.
- **NFR-3 Reliability**: automation failures degrade gracefully to the co-pilot review
  queue rather than silently failing or retry-looping against a third-party site.
- **NFR-4 Observability**: every AI-generated artifact and every automated action is
  logged and attributable, for both user trust and internal debugging.
- **NFR-5 Accessibility**: web app meets WCAG 2.1 AA.
- **NFR-6 Performance**: job feed loads in <2s p95 for a user with up to ~10k cached
  postings; tailoring generation completes in <15s p95 per document.
- **NFR-7 Extensibility**: ATS connector registry (Tier-1 vs Tier-2) is pluggable —
  adding a new native integration should not require touching core application logic.

## 6. Explicitly out of scope for MVP

- Server-side/offline "apply while I'm asleep" automation (requires credential custody we
  are deliberately not doing — revisit only as an explicit, separately-consented, later
  phase; see `MVP_ROADMAP.md`).
- Recruiter CRM / outreach sequencing.
- Interview preparation / mock interviews.
- Salary negotiation tooling.
- Native mobile apps.
- Team/enterprise multi-seat features.

## 7. Success metrics

- Activation: % of signups who complete profile + first tailored resume within 48h.
- Automation trust: % of co-pilot users who graduate to auto-pilot within 30 days.
- Efficacy: applications submitted per user per week; interview-rate per application vs.
  self-reported baseline (survey-based, since we cannot observe outcomes outside our system).
- Reliability: % of automated submissions that fail and require manual fallback.
- Retention: week-4 and week-8 retention of active job seekers.
