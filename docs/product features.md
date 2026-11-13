# 2. Product modules and final feature specification

## Module A — Candidate Intelligence

**Purpose:** Maintain one reliable, structured representation of the candidate.

### Features
- Resume upload and management.
- Personal and professional profile.
- Work experience.
- Education.
- Skills and technologies.
- Projects and certifications.
- Job preferences.
- Multiple resume versions.
- Profile completion indicator.

### Business logic

1. Extract information from uploaded resumes.
2. Convert it into structured profile fields.
3. Mark each field as user-confirmed, AI-extracted or unverified.
4. Allow users to edit extracted information.
5. Use confirmed profile information as the primary source for matching and application generation.
6. Preserve the original resume and previous versions.

**Data integrity rules**
- Never invent skills, employers, qualifications, dates or achievements.
- Do not treat an AI-suggested skill as a confirmed candidate skill.
- Preserve original information when generating tailored resumes.
- Allow candidates to maintain multiple resumes for different job categories.

### Job preferences

Users should be able to define:
- Target job titles.
- Experience level.
- Preferred locations.
- Remote, hybrid or onsite.
- Employment type.
- Salary expectations.
- Preferred industries.
- Excluded companies.
- Skills or roles they do not want.

Preferences must be editable without uploading a new resume.

---

## Module B — Job Discovery

**Purpose:** Find real, current opportunities from multiple permitted sources.

### Job sources

Use two source categories.

**1. Company career pages and ATS integrations**
- Greenhouse.
- Lever.
- Other supported ATS platforms.
- Direct company career pages where permitted.

**2. External job sources**
- Licensed job APIs.
- Public job feeds with permitted usage.
- Aggregators with suitable API or partner access.

Do not assume that every source permits scraping, redistribution or automated applications. Each connector must respect its access terms and capabilities.

### Job discovery features
- Personalized job feed.
- Search by title, keyword and company.
- Location and remote filters.
- Experience filters.
- Employment type filters.
- Salary filters when data exists.
- Sort by relevance, newest and salary.
- Job details.
- Original application link.
- Save and dismiss jobs.
- Report incorrect or expired jobs.

### Required normalized job information

| Field | Purpose |
|---|---|
| Job title | Search and matching |
| Company | Company identification |
| Description | Matching and AI analysis |
| Required skills | Candidate comparison |
| Preferred skills | Additional relevance |
| Experience range | Eligibility and scoring |
| Location | Location matching |
| Work mode | Remote/hybrid/onsite |
| Employment type | Full-time, contract, etc. |
| Salary | Salary filtering |
| Posted date | Freshness |
| Application URL | Apply destination |
| Source | Provenance |
| Last verified | Freshness checks |
| Status | Open, closed, expired or unknown |

### Job ingestion logic

Every source follows this workflow:

1. Fetch available job postings.
2. Convert source-specific data into ApplyFocus's common job format.
3. Validate required fields.
4. Normalize job titles, locations, skills and employment types.
5. Identify duplicates.
6. Check whether the job is still available.
7. Store or update the posting.
8. Record its source and verification time.

### Duplicate detection

Use a combination of:
- Source job ID.
- Canonical application URL.
- Company identity.
- Normalized job title.
- Location.
- Similarity of job descriptions.

Do not merge two jobs merely because their titles are identical.

If the same opportunity appears through multiple sources, maintain one canonical job record and retain its source references.

### Job freshness rules

- Preserve the original posting date when available.
- Record when the job was last checked.
- Mark jobs closed when the source explicitly confirms closure.
- Mark unverified jobs separately instead of assuming they are open.
- Remove closed jobs from the default active feed.
- Recheck old postings periodically.
- Never fabricate posting dates.

---

## Module C — AI Job Matching

**Purpose:** Rank jobs according to actual candidate suitability.

This is a core product differentiator.

### Matching architecture

Use a hybrid approach:

1. Hard preference filtering.
2. Structured rule-based scoring.
3. Skill normalization and equivalence.
4. Semantic similarity.
5. Explainable match results.

Do not send every job and resume to an LLM for a fresh decision. Use deterministic calculations for the score and AI selectively for semantic understanding and explanations.

### Step 1: Hard filters

Apply only when the candidate has explicitly selected a preference as strict.

Examples:
- Excluded company.
- Excluded employment type.
- Location restrictions.
- Explicitly excluded job categories.
- Closed or expired job.

Important: Do not automatically reject a job because one field is missing. Unknown information should be shown as unknown.

Experience mismatch should generally affect the score rather than act as an automatic rejection. A user can optionally configure a strict experience limit.

### Step 2: Scoring model

Initial scoring weights:

| Factor | Weight |
|---|---:|
| Skills compatibility | 40 |
| Job title and role relevance | 20 |
| Experience compatibility | 15 |
| Location compatibility | 10 |
| Seniority compatibility | 10 |
| Employment preference | 5 |
| **Total** | **100** |

Each factor produces a normalized score from 0 to 100.

Formula:

`Match Score = Σ(Factor Score × Factor Weight) / Σ(Available Factor Weights)`

The available factor weights are those for which sufficient information exists.

Also calculate a separate **data coverage score**:

`Data Coverage = Σ(Available Factor Weights) / 100 × 100`

If coverage is below 60%, do not present the score as a confident recommendation. Show an insufficient-data indicator.

These weights are starting hypotheses. Calibrate them against real job/candidate examples and user feedback.

### Step 3: Skills matching

Use:
- Exact skill matching.
- Normalized skill names.
- Curated aliases and equivalent terms.
- Semantic similarity for related concepts.

Example:

| Candidate skill | Job requirement | Result |
|---|---|---|
| Python | Python | Exact |
| FastAPI | Python backend development | Related |
| PostgreSQL | PostgreSQL | Exact |
| React | Angular | Not equivalent |

Do not mark two technologies as equivalent simply because they belong to the same category.

### Step 4: Experience compatibility

Compare:
- Candidate's relevant experience.
- Job's minimum experience.
- Job's maximum experience.
- Candidate's seniority.
- Whether the role accepts freshers.

Distinguish professional work experience from academic projects and personal projects.

For missing or ambiguous job requirements, return an unknown result rather than inventing a requirement.

### Step 5: Semantic matching

Use embeddings or semantic models to identify related skills, responsibilities and role descriptions that exact keyword matching misses.

Semantic matching may improve relevance, but it must not override hard user preferences or fabricate candidate qualifications.

### Step 6: Match explanation

Each match should provide:

- Overall score.
- Data coverage.
- Matching skills.
- Missing required skills.
- Related experience.
- Role compatibility.
- Location compatibility.
- Important mismatches.
- Reasons for uncertainty.

### Match categories

Suggested initial presentation:

| Score | Label |
|---|---|
| 85–100 | Excellent match |
| 70–84 | Strong match |
| 55–69 | Potential match |
| Below 55 | Low match |

These are UI categories, not guarantees of interview success.

### Matching feedback loop

Allow users to:
- Save a job.
- Dismiss a job.
- Mark a job irrelevant.
- Report incorrect information.

Use this feedback to improve personalization. Do not silently change scoring weights based on a single action.

---

## Module D — Job Feed and Search Experience

**Purpose:** Turn discovered jobs into a useful daily experience.

### Job feed card

Each card should show:

- Job title.
- Company.
- Location.
- Work mode.
- Experience requirement.
- Salary when available.
- Posting freshness.
- Match score.
- Top two or three matching reasons.
- Save action.
- Dismiss action.

### Filters
- Job title.
- Company.
- Location.
- Remote/hybrid/onsite.
- Experience.
- Employment type.
- Salary.
- Match score.
- Posting date.

### Job details page

Include:
- Complete job description.
- Responsibilities.
- Required qualifications.
- Preferred skills.
- Company information.
- Match breakdown.
- Missing requirements.
- Original application link.
- Save and apply actions.

The feed should prioritize relevance but allow users to sort by newest and search independently.

---

## Module E — Resume Intelligence

**Purpose:** Help candidates prepare a resume for a specific opportunity.

### Features
- Job-specific resume analysis.
- Missing keyword identification.
- Skills-gap identification.
- Professional summary improvement.
- Bullet-point rewriting.
- Resume tailoring.
- ATS-friendly formatting.
- Resume version comparison.
- Download tailored resume.

### Tailoring workflow

1. User selects a job.
2. ApplyFocus selects the candidate's chosen resume.
3. Compare resume content with the job description.
4. Identify relevant existing experience and skills.
5. Generate suggested improvements.
6. Validate generated content against candidate evidence.
7. Display a before-and-after comparison.
8. User edits and approves.
9. Save a new resume version.

### Non-negotiable rules

- Never fabricate achievements.
- Never add unverified skills.
- Never invent years of experience.
- Never change employer names or dates.
- Preserve the original resume.
- Clearly show AI-generated changes.
- Require user approval before using a tailored resume.

---

## Module F — Cover Letters and Application Preparation

### Features
- Job-specific cover letters.
- Editable cover letter templates.
- Screening question assistance.
- Reusable candidate answers.
- Application readiness checklist.
- Application document storage.

### Screening question logic

Classify questions into:

1. Factual profile questions.
2. Preference questions.
3. Eligibility questions.
4. Subjective or personal questions.

Use verified profile data for factual questions.

For preference and subjective questions, ask the user when the answer is unknown.

Never guess:
- Work authorization.
- Visa status.
- Salary expectations.
- Notice period.
- Willingness to relocate.
- Disability or demographic disclosures.
- Legal eligibility.

---

## Module G — Application Management

**Purpose:** Track the entire job search in one place.

### Application statuses

- Discovered.
- Saved.
- Preparing.
- Ready to apply.
- Applied.
- Assessment.
- Interview.
- Offer.
- Rejected.
- Withdrawn.

### Features
- Kanban board.
- Application history.
- Company and recruiter details.
- Application date.
- Notes.
- Follow-up reminders.
- Interview dates.
- Associated resume and cover letter.
- Status history.

### Business logic

A discovered or saved job is not an application.

An application becomes Applied only after:
- The user confirms they submitted it, or
- A supported integration verifies successful submission.

Record the source of each status update.

Never treat a form being filled as proof that an application was submitted.

---

## Module H — Browser Automation

**Purpose:** Reduce repetitive application work.

### Copilot mode — default

1. User opens a supported job application page.
2. Extension identifies the ATS.
3. Extension detects application fields.
4. It maps fields to verified candidate data.
5. It fills fields with sufficient confidence.
6. It highlights unknown or ambiguous fields.
7. User reviews the complete form.
8. User explicitly submits.
9. Extension records the result where it can verify it.

### Autopilot mode — later, optional

Autopilot must be explicitly enabled by the user.

User-configurable constraints:
- Approved job titles.
- Minimum match score.
- Allowed locations.
- Salary requirements.
- Excluded companies.
- Maximum applications per day.
- Approved resume.
- Approved reusable answers.
- ATS platforms allowed.

Before any submission, the system must:
- Confirm that the job meets the user's rules.
- Confirm that all mandatory fields have valid answers.
- Confirm that generated content is grounded in approved information.
- Stop when a question requires an unknown personal or legal answer.
- Maintain an audit record.
- Provide a kill switch.

Do not implement autopilot until copilot automation is demonstrably reliable.

### ATS integration tiers

| Tier | Method | Behaviour |
|---|---|---|
| 1 | Official API | Use only when application submission is supported |
| 2 | Browser automation | Fill supported forms in the user's session |
| 3 | Unsupported | Provide the original application link |

A job-listing API does not imply an application-submission API.

---

## Module I — Analytics and Notifications

### Analytics
- Jobs discovered.
- Relevant matches.
- Saved jobs.
- Applications submitted.
- Interviews.
- Offers.
- Response rate.
- Application conversion rate.
- Search activity over time.

### Notifications
- New high-quality job matches.
- Saved job closing.
- Application follow-up reminders.
- Interview reminders.
- Application status changes when verified.

Do not send notifications for every low-quality job. Let users configure frequency and thresholds.

---

# 3. Main user flows

## Flow 1 — First-time onboarding

1. User creates an account.
2. User uploads a resume.
3. ApplyFocus extracts candidate information.
4. User reviews and confirms the information.
5. User selects target job titles.
6. User selects preferred locations and work modes.
7. User selects experience and employment preferences.
8. User lands on the personalized dashboard.

**Success condition:** The system has enough verified candidate information to start meaningful job discovery.

## Flow 2 — Discover jobs

1. Job ingestion collects postings from enabled sources.
2. Postings are normalized and deduplicated.
3. Closed or expired postings are identified.
4. Candidate preferences are applied.
5. Matching calculates scores.
6. Relevant jobs appear in the personalized feed.
7. User searches, filters, saves or dismisses jobs.

**Success condition:** Users can discover real opportunities with understandable relevance explanations.

## Flow 3 — Apply to a job

1. User opens a matched job.
2. User reviews its requirements and match explanation.
3. User selects a resume.
4. ApplyFocus generates a tailored resume.
5. User reviews and approves the changes.
6. ApplyFocus generates an optional cover letter.
7. User opens the application.
8. Copilot fills supported fields.
9. User reviews and submits.
10. Application is recorded.

**Success condition:** A real application is submitted, and the tracker reflects the correct status.

## Flow 4 — Application tracking

1. User saves or submits an application.
2. User records application status.
3. User adds notes and recruiter details.
4. User sets follow-up reminders.
5. User updates assessment and interview progress.
6. Dashboard analytics reflect the updated information.

## Flow 5 — Autopilot

1. User enables autopilot.
2. User defines strict eligibility and submission limits.
3. ApplyFocus discovers matching jobs.
4. Jobs are evaluated against the user's rules.
5. Supported applications are prepared.
6. The system validates all required information.
7. Eligible applications may be submitted within the user's approved constraints.
8. Every action is recorded and surfaced to the user.
9. The user can pause or revoke automation at any time.

Autopilot is not part of the initial MVP.

---

# 4. MVP scope — what we build first

The MVP must solve one meaningful problem extremely well.

**MVP promise: Upload your resume and discover relevant, genuine job opportunities from India and global sources.**

### Must-have features

| Feature | MVP |
|---|---|
| Signup and login | Yes |
| Candidate profile | Yes |
| Resume upload and parsing | Yes, with verified extraction |
| Job discovery | Yes |
| Multiple job source connectors | Yes, limited initial coverage |
| Job normalization and deduplication | Yes |
| Personalized job feed | Yes |
| Job search and filters | Yes |
| Hybrid match score | Yes |
| Match explanation | Yes |
| Save and dismiss jobs | Yes |
| Job detail page | Yes |
| Original application links | Yes |
| Basic application tracker | Yes |

### Not in the initial MVP

- Automatic application submission.
- Large-scale browser automation.
- Autopilot.
- Recruiter email intelligence.
- Interview preparation.
- Advanced analytics.
- Mobile applications.
- Team accounts.
- Complex billing infrastructure.

These can be added after the core experience is validated.

### MVP acceptance criteria

A real user must be able to:

1. Register and create a profile.
2. Upload and verify their resume.
3. Set job preferences.
4. Discover genuine job postings.
5. Search and filter jobs.
6. Receive explainable personalized matches.
7. Save and dismiss jobs.
8. Open the original application page.
9. Track jobs they intend to apply to.

Quality targets for the first release:

- No fabricated job postings.
- No accidental cross-user data exposure.
- No duplicate jobs in the same feed where the source identifies the same opportunity.
- No fabricated candidate qualifications.
- Every displayed job has source provenance.
- Match scores expose their data coverage and rationale.
- Job freshness is visible.
- All core actions work on desktop and mobile layouts.

---

# 5. Freemium business model

Start with a genuinely useful free plan.

### Free
- Candidate profile.
- Resume management.
- Personalized job feed.
- Basic matching.
- Job search and filters.
- Saved jobs.
- Basic application tracker.

### Premium
- More resume-tailoring generations.
- Advanced matching and filters.
- Multiple tailored resume versions.
- Cover letter generation.
- Screening answer assistance.
- Advanced analytics.
- More frequent personalized job alerts.
- Higher AI usage limits.

### Future premium capabilities
- Browser copilot.
- Additional automation limits.
- Optional autopilot.
- Advanced application analytics.

Do not decide final prices before validating usage, AI costs and willingness to pay. The free product must be useful enough to establish trust.

---

# 6. Product data and core entities

Keep the data model understandable. Extend the existing schema only when a feature needs it.

Core entities:

| Entity | Responsibility |
|---|---|
| User | Account and authentication |
| Profile | Candidate information |
| Resume | Uploaded resume versions |
| ResumeParsedData | Extracted structured data |
| Job | Canonical job posting |
| JobSource | Source-specific posting reference |
| Company | Employer identity |
| Match | Candidate-job match result |
| SavedJob | Saved and dismissed jobs |
| Application | Candidate's application |
| ApplicationEvent | Status history |
| TailoredResume | Job-specific resume version |
| CoverLetter | Generated cover letter |
| ScreeningAnswer | Approved reusable answers |
| AutomationSession | Browser automation state |
| Notification | User alerts |

Important distinctions:

- A job is not an application.
- A saved job is not an application.
- A tailored resume is not the original resume.
- An application attempt is not a successful submission.
- An unknown field is not a negative match.

---

# 7. Implementation sequence

Build in this order. Each stage should deliver a usable product capability.

## Stage 0 — Verify Phase 1 quality

- Test real resumes, not just synthetic samples.
- Verify PDF and DOCX extraction.
- Test profile editing and persistence.
- Verify user data isolation.
- Check mobile usability.
- Confirm resume download and deletion work.

Do not rebuild working Phase 1 functionality.

## Stage 1 — Real job discovery

- Implement the first company ATS connectors.
- Add one permitted external job source.
- Normalize job information.
- Build deduplication.
- Add job freshness checks.
- Display real jobs in the application.

**Deliverable:** Users can see real jobs from multiple sources.

## Stage 2 — Job feed and search

- Build job cards.
- Build job details.
- Add search and filters.
- Add save and dismiss.
- Add source and freshness labels.

**Deliverable:** A usable personalized job discovery experience.

## Stage 3 — Hybrid matching

- Implement structured matching.
- Add skill normalization.
- Add semantic matching.
- Calculate weighted scores.
- Show data coverage.
- Generate grounded explanations.
- Allow feedback on irrelevant matches.

**Deliverable:** ApplyFocus recommends jobs with understandable reasons.

## Stage 4 — Basic application management

- Add saved job lifecycle.
- Add application tracker.
- Add status updates.
- Add notes and dates.
- Connect applications to jobs and resumes.

**Deliverable:** Users can manage their job search in one place.

## Stage 5 — Resume intelligence

- Compare resume against job description.
- Identify relevant existing skills.
- Generate tailored resume suggestions.
- Show before-and-after changes.
- Validate against candidate facts.
- Save approved resume versions.

**Deliverable:** Users can prepare stronger applications.

## Stage 6 — Application preparation

- Generate cover letters.
- Assist with screening answers.
- Add application readiness checks.
- Store application documents.

**Deliverable:** Users can prepare an application from the job details page.

## Stage 7 — Browser copilot

- Build ATS detection.
- Implement supported field mapping.
- Fill candidate details.
- Upload selected resume.
- Flag unknown answers.
- Add review-before-submit.
- Record verified application outcomes.

**Deliverable:** Users can complete supported application forms faster.

## Stage 8 — Optional autopilot

- User-defined rules.
- Application limits.
- Confidence checks.
- Explicit consent.
- Audit history.
- Pause and revoke controls.
- Safe handling of unknown questions.

**Deliverable:** Controlled automation that operates only within the user's approved boundaries.

## Stage 9 — Monetization and analytics

- Usage tracking.
- Free and premium limits.
- Billing.
- Subscription management.
- Search analytics.
- Conversion insights.

**Deliverable:** A sustainable SaaS business.

---

# 8. Product quality principles

These principles apply to every feature.

1. **Real functionality:** Every button and action must work.
2. **Truthfulness:** Never invent job or candidate information.
3. **Source transparency:** Show where jobs came from.
4. **User control:** The user owns their applications and decisions.
5. **Explainability:** Important AI decisions must have understandable reasons.
6. **Data accuracy:** Validate extracted and generated information.
7. **Freshness:** Avoid showing stale job opportunities as active.
8. **Simplicity:** Build the smallest implementation that solves the user problem.
9. **Consistency:** The same candidate information should be reused throughout the product.
10. **Trust:** Never submit an application without the required user authorization.

# 9. What not to build

To prevent over-engineering:

- No microservices unless an actual scaling need emerges.
- No Kubernetes for the initial product.
- No custom AI agent framework.
- No unnecessary abstractions for hypothetical future integrations.
- No complex recommendation infrastructure before validating basic matching.
- No large-scale scraping infrastructure.
- No elaborate analytics before real application data exists.
- No extensive documentation for every small implementation.
- No rewriting working Phase 1 features without a demonstrated problem.

Use the existing codebase and stack. Add complexity only when a concrete feature requires it.

# 10. First development milestone

The immediate goal is not to build the entire platform.

It is to complete this user experience:

**Upload resume → Set preferences → Discover real jobs → Understand matches → Save interesting opportunities → Open the original application.**

The first milestone should demonstrate this with a small, reliable selection of Indian and international job sources.

Once that works with real users and real postings, expand matching, resume intelligence and application automation.
