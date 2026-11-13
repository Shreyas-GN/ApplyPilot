# Reverse Engineering: Tsenta

## 0. Methodology & a critical access limitation

This analysis was supposed to combine direct inspection of `tsenta.com` (and its Chrome
extension, YC listing, press coverage, and third-party reviews) with the installed "REA"
(Reverse Engineer Anything) skill. Neither was available in practice:

- **REA skill**: not active in this session (not present in the skill/plugin registry).
  A similarly-named community plugin exists in the marketplace but was not enabled. Per
  product-owner decision, we proceeded **without** it rather than installing an unverified
  third-party plugin mid-task.
- **Direct site/page access**: this environment's outbound network policy blocked every
  host attempted — `tsenta.com`, `chromewebstore.google.com`, `ycombinator.com`,
  `yourstory.com`, `loopcv.pro`, `remoterocketship.com`, `trustpilot.com` — all failed DNS
  resolution (`ENOTFOUND`). No page was ever actually fetched. Per product-owner decision,
  we proceeded using only **search-engine result snippets** (via `WebSearch`), which quote
  or paraphrase these pages second-hand.

**Consequence: confidence in everything below is lower than a normal reverse-engineering
pass.** No screenshot, no HTML, no HAR/network trace, and no live interaction with Tsenta
was observed. This document is a synthesis of what search snippets *say* these pages say,
plus third-party commentary (some of it from direct competitors, who have an incentive to
describe Tsenta unfavorably). Nothing here should be treated as equivalent to firsthand
product inspection.

### Confidence legend

| Tag | Meaning |
|---|---|
| `[MULTI-SOURCE]` | Corroborated by 2+ independent (non-affiliated) sources |
| `[SINGLE-SOURCE]` | Appears in exactly one source found |
| `[CONFLICTING]` | Sources disagree; all variants listed |
| `[COMPETITOR CLAIM]` | Sourced from a rival product's marketing/review page — treat as biased |
| `[USER ANECDOTE]` | Secondhand user-reported experience (e.g., a quoted Reddit post) — anecdotal, not verified |
| `[ASSUMPTION]` | **Not found in any source.** Industry-typical inference only — explicitly not a claim about Tsenta |

---

## 1. Company facts

- Y Combinator-backed, **Summer 2026 (S26) batch**. `[MULTI-SOURCE]`
- Founders: **Agnay Srivastava** and **Pulkit Gupta**, both Rose-Hulman Institute of
  Technology computer science students (one a senior, one a sophomore per the school's own
  press release). `[SINGLE-SOURCE]` — the source release lists one name twice, so one of
  the two names may be a typo in the original article; treat founder identity as
  provisional.
- Reported funding: **$500,000** (described as the Rose-Hulman release's framing of YC's
  investment). `[SINGLE-SOURCE]`
- Founding narrative: founders have said (via secondary quotes, not directly fetched) that
  they applied to roughly 3,000 jobs by hand before building the product. `[SINGLE-SOURCE]`
- No independent account of the original "why we built this" story was found beyond that.

## 2. Core product concept

Tsenta is positioned as an **AI career agent that discovers, tailors for, and submits job
applications on the user's behalf**. `[MULTI-SOURCE]`

Claimed capability chain (consistent across most sources, though exact wording varies):
1. Monitor job postings across job boards and company career pages.
2. Match postings to the user's profile/resume.
3. Tailor a resume and cover letter per role.
4. Fill out and submit the application, including open-ended screening questions.
5. Track application status and (per one source) route recruiter emails.

## 3. Distribution / form factor — `[CONFLICTING]`

- A Chrome Web Store listing describes a **browser extension** that is a "companion" to a
  web dashboard — detects jobs with one click, and "applies from the cloud."
- One YC-affiliated listing separately describes it as a **desktop app**.
- No source describes a mobile app.

We cannot resolve this conflict without page access. The extension-plus-dashboard framing
is the most repeated one and is what we treat as most likely, but it is not confirmed.

## 4. Operating modes

- At least one source describes **"Co-pilot" (review-first) and "Auto-pilot" (hands-off)**
  modes. `[SINGLE-SOURCE]`
- A separate source instead describes a **per-application "diff view"** the user approves
  before submission, without naming two distinct modes. `[SINGLE-SOURCE]`
- A third-party competitor review (resumeup.ai, itself a rival product) claims Tsenta "logs
  into the ATS, fills fields, answers screening questions, and submits" — i.e., describes a
  fully automated path existing. `[COMPETITOR CLAIM]`

These may all be describing the same underlying behavior from different angles (a
hands-off default with an optional/available review step), but we have no primary source
to confirm the actual UI or default behavior.

## 5. Claimed coverage — `[CONFLICTING]`, numbers unverifiable

| Claim | Source type |
|---|---|
| Detects jobs on LinkedIn, Indeed, Glassdoor + "15+ ATS" | Chrome Web Store listing (secondhand) |
| "50,000+ career pages" + "19+ ATS" | Review site (LoopCV) |
| "150+ ATS" on paid tiers | Unattributed listing site |
| "500,000+ verified company career pages" | This figure belongs to **JobCopilot**, a competitor — not Tsenta. Including it here only to flag that aggregator pages conflate competitors' numbers. |

**No source named a single specific ATS platform Tsenta actually integrates with** (no
confirmation of Greenhouse, Lever, Workday, iCIMS, SuccessFactors, etc. by name for Tsenta
specifically). Any such list would be `[ASSUMPTION]` dressed up as fact — we are explicitly
not inventing one.

## 6. Pricing — `[CONFLICTING]`, treat all figures as unreliable

| Claim | Source |
|---|---|
| $39/mo (Pro), $99/mo (Power) | Review site (LoopCV) |
| One-time $199 for 250 applications | Unattributed listing |
| Freemium, unspecified tiers | Unattributed listing |
| 25 free applications, then $19–$99/mo | Competitor review (resumeup.ai) `[COMPETITOR CLAIM]` |

No two sources agree. We are not using any of these numbers as ApplyFocus inputs beyond
"freemium-with-paid-tiers is the category norm."

## 7. Reported limitations / user experience — mostly anecdotal, low confidence

- Resume formatting reportedly breaks on page 2 in some cases. `[SINGLE-SOURCE]`
- Occasional autofill inaccuracies (one tester reports a missed LinkedIn URL and missed
  university name). `[SINGLE-SOURCE]`, from a competitor-adjacent review.
- A secondhand, unverified Reddit claim (relayed via a competitor's blog, not read directly):
  a user reported 655 applications with no interview callbacks. `[USER ANECDOTE]`,
  low confidence, competitor-relayed.
- A rival (scale.jobs, a human-assisted competitor) argues high-volume auto-apply produces
  generic, keyword-heavy applications. `[COMPETITOR CLAIM]` — this is marketing from a
  direct rival and should be weighted accordingly, not treated as neutral analysis.
- Trustpilot has a review page for tsenta.com, but it could not be read (network-blocked);
  only its existence is confirmed.

## 8. Competitive positioning (as described by third parties, not Tsenta)

- Positioned as a **direct competitor to JobCopilot** (both "hands-off AI agent" auto-apply
  tools).
- Contrasted with **Simplify Copilot**, which per its own help documentation is
  autofill-only — it does not submit applications for the user, the user reviews/submits
  every one themselves. This is a meaningful product-category distinction (autofill
  assistant vs. auto-submit agent) worth keeping straight.
- Contrasted with **LazyApply**, a browser extension focused on high application volume on
  LinkedIn/Indeed, reported (by a competitor's page) to carry a low Trustpilot rating
  (~2.1/5) with recurring form-filling-error complaints. `[COMPETITOR CLAIM]`

## 9. What remains genuinely unknown

We did not confirm, and are not guessing at:
- Actual tech stack, infrastructure, or engineering architecture.
- The real onboarding flow, actual screen layouts, or visual design.
- The actual resume-tailoring algorithm/model.
- Actual data handling, retention, or credential-storage practices.
- Team size beyond the two named founders.
- Whether application submission happens from the user's own browser session or from
  Tsenta-controlled infrastructure (this is the single most consequential unknown for
  compliance/liability purposes, and sources conflict on it — see §3–4).

## 10. Sources consulted (search-snippet level only — pages were not fetched)

- Chrome Web Store listing (Tsenta extension) — via search snippet only
- YC launch page and YC company directory page — via search snippet only
- `yourstory.com` feature article (2026-06) — via search snippet only
- `loopcv.pro` Tsenta review — via search snippet only
- `stork.ai` comparison pages (Tsenta vs. Simplify Copilot / LazyApply / AIApply / JobLoo)
- `scale.jobs` competitor alternative pages
- `resumeup.ai` competitor review ("I Ran 25 Applications")
- Rose-Hulman Institute press release on founders/funding
- Trustpilot listing page (existence only, content unread)

## 11. Implication for ApplyFocus

Given this access ceiling, ApplyFocus's requirements in this repo are **not** a clone of
confirmed Tsenta behavior — they are an **independent design** for the same product
category (AI-assisted job search and application automation), informed loosely by the
category patterns above (auto-apply agents, co-pilot review steps, ATS-coverage marketing
claims, extension-based distribution) rather than by verified Tsenta internals. Two
execution-model decisions were made deliberately in the *opposite* direction of what some
sources suggest Tsenta may do server-side, specifically to reduce legal/security risk — see
`SYSTEM_ARCHITECTURE.md` §2 and §6.
