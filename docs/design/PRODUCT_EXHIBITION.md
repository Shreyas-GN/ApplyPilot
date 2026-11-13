ApplyFocus — Product Exhibition
Purpose: Define the product visuals that make the landing page feel credible and memorable. These are product demonstrations, not decorative illustrations.
1. The visual story
Show one coherent journey:
Profile → Opportunity → Fit → Preparation → Follow-through
The user should understand how each stage leads to the next. Reuse the same candidate, role and application data throughout all mockups.
2. Shared sample scenario
Use this consistent fictional sample data in all visual previews:
Candidate

* Name: Asha Rao
* Target role: Backend Software Engineer
* Location preference: Bengaluru / Remote
* Experience: Early career
* Skills: Python, FastAPI, PostgreSQL, REST APIs

Opportunity

* Role: Backend Engineer
* Company: Northstar Systems (fictional)
* Work mode: Hybrid
* Location: Bengaluru
* Requirements shown: Python, API development, relational databases

Clearly fictional sample company names are acceptable. Do not use real company logos without permission.
3. Artifact 1 — Candidate profile
What it demonstrates
A structured candidate profile that brings résumé information, skills, experience and preferences together.
Visual structure

* Main panel with candidate name and target role.
* Skills grouped into readable tags.
* Experience and education shown as concise timeline entries.
* A small source/confidence marker for parsed information that needs review.
* One visible action: "Review profile" or "Edit profile".

States

* Empty profile.
* Profile populated.
* Parsed information awaiting review.
* User-confirmed profile.

Quality rule
Never show invented candidate facts. Use the sample scenario above and mark it as sample data.
4. Artifact 2 — Opportunity discovery
What it demonstrates
A curated list of roles with enough context to compare opportunities.
Visual structure

* Left or top: role list with title, company, location and work mode.
* Main detail: selected role and concise job summary.
* Tags for skills and role type.
* A small "Why it may fit" entry point.
* Filters should be visible only if they work.

States

* Initial loading.
* Results available.
* No matching results.
* Source unavailable / role expired.
* Saved role.

Quality rule
Do not invent live job listings, source coverage, fresh timestamps or job counts. For static marketing mockups, identify the data as illustrative.
5. Artifact 3 — Match explanation
What it demonstrates
The system explains the evidence behind a recommendation rather than showing an unexplained score.
Visual structure

* Role title and company.
* A short fit summary.
* "Strong alignment" evidence: skills or experience that match.
* "Needs attention" evidence: requirements not present or unclear in the profile.
* "Not enough information" where the profile cannot support a conclusion.
* One action: "Review match".

States

* Strong evidence.
* Mixed evidence.
* Insufficient profile information.

Quality rule
Do not use a match percentage unless the actual scoring method is implemented, validated and explainable. Do not describe missing evidence as a candidate weakness.
6. Artifact 4 — Application preparation
What it demonstrates
Application material can be prepared and reviewed before the candidate uses it.
Visual structure

* Selected job context.
* Résumé version selector.
* Before/after excerpt or highlighted changes.
* Cover letter preview.
* Change summary with reasons.
* Clear "Edit", "Keep original" and "Approve" actions.

States

* Draft generating.
* Draft ready for review.
* User editing.
* Approved version.
* Generation error / retry.

Quality rule
Never imply the system silently changes a résumé or submits an application without the candidate's approval. Do not fabricate measurable improvements or ATS scores.
7. Artifact 5 — Application tracker
What it demonstrates
The candidate can see the status and next action for each application.
Visual structure

* Compact list or restrained columns: Preparing, Applied, Interview, Closed.
* Each application row shows role, company, date and current status.
* A next-action note where appropriate.
* Timeline detail for a selected application.

States

* No applications yet.
* Applications in progress.
* Interview scheduled.
* Rejected / closed.
* Needs user update.

Quality rule
Do not invent recruiter replies, email access, automatic status detection or calendar integration. Show only data the product actually stores or can reliably obtain.
8. Composition system
Use varied compositions so the page feels art-directed:

* Profile: close-up, document-like panel.
* Discovery: broad opportunity list with one selected role.
* Match: evidence-led split panel.
* Preparation: side-by-side document comparison.
* Tracking: compact timeline or status board.

Do not render every artifact as the same rounded rectangle with an icon and heading.
9. Product UI fidelity

* Use consistent navigation, typography, spacing and status colours across all artifacts.
* Use the same sample candidate and job in every preview.
* Keep text readable at the size it will appear on the page.
* Avoid meaningless charts, fake notifications, fake browser chrome and random avatars.
* Use believable content density. Real software has hierarchy, not a wall of badges.
* Keep UI controls visually clear; do not show buttons that imply functionality that does not exist.
* Add "Illustrative preview" where the mockup is not connected to a live feature.

10. Current capability truth
Before using any artifact publicly, check it against the actual product build.
The currently completed product foundation includes:

* Authentication and account flows.
* Candidate profile management.
* Résumé upload and version management.
* Résumé parsing with review/correction/confirmation.

The following are product direction / future capabilities until implemented and tested:

* Job discovery and aggregation.
* Explainable job matching.
* Résumé tailoring and cover-letter generation.
* Application preparation and submission automation.
* Application tracking and recruiter-email intelligence.
* Browser extension and opt-in autopilot.

Do not depict future capabilities as live, generally available functionality. If the page is intentionally communicating the product vision, label the relevant areas "Coming next" or "Product preview".
11. Acceptance checklist

* One consistent fictional candidate and role across every visual.
* Every visible claim maps to a real feature or is labelled as illustrative.
* No fake customer logos, testimonials, metrics or recruiter messages.
* Match explanations show evidence, not arbitrary percentages.
* Candidate approval is visible before consequential actions.
* Product UI is legible on desktop and mobile.
* Each artifact has a distinct composition.
* No decorative dashboard elements without a clear purpose.
