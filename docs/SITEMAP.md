# ApplyPilot — Sitemap & Information Architecture

> **Source of truth for URL structure, route ownership, and page hierarchy.**
> Grounded in `PRODUCT_REQUIREMENTS.md`, `USER_FLOWS.md`, `UI_UX.md`,
> `FEATURES.md`, `MVP_ROADMAP.md`, and `product features.md`.
> Phase labels: ✅ shipped · 🔜 Phase 2 · 🔷 Phase 3 · 🔶 Phase 4 · 🔹 Phase 5

---

## 1. Public (unauthenticated) surface

| Route | Page | Notes |
|---|---|---|
| `/` | Marketing landing page | Hero, workflow, product showcase, FAQ, CTA ✅ |
| `/signup` | Registration | Email + OAuth ✅ |
| `/login` | Log in | Email + OAuth ✅ |
| `/forgot-password` | Forgot password | Sends reset link ✅ |
| `/reset-password` | Reset password | Token-gated ✅ |
| `/verify-email` | Email verification | Token-gated; resend link ✅ |
| `/privacy` | Privacy policy | Placeholder → full policy ✅ |
| `/terms` | Terms of service | Placeholder → full ToS ✅ |
| `/about` | About / mission | Company values, team (optional) |
| `/blog` | Blog index | Content marketing (Phase 5) 🔹 |
| `/blog/[slug]` | Blog post | 🔹 |
| `/changelog` | Product changelog | Public release notes |
| `/status` | Service status | Uptime / incident page (links to external provider) |

---

## 2. Onboarding flow (post-signup, pre-dashboard)

Onboarding is a wizard — routes are sequential but each is a discrete URL so the user can
deep-link or resume if they drop off. All require authentication.

| Route | Step | Notes |
|---|---|---|
| `/onboarding` | Onboarding root | Redirects to first incomplete step |
| `/onboarding/upload` | Upload resume | PDF / DOCX; triggers async parse pipeline ✅ |
| `/onboarding/review` | Review parsed profile | Confidence flags, per-field correction ✅ |
| `/onboarding/confirm` | Confirm to profile | Explicit confirm before profile is populated ✅ |
| `/onboarding/preferences` | Job preferences | Roles, locations, remote, salary, exclusions ✅ |
| `/onboarding/connect-extension` | Install browser extension | Skippable; shows extension-store link 🔷 |
| `/onboarding/done` | Onboarding complete | Redirects to `/feed` |

---

## 3. Authenticated app — top-level sections

All routes below require authentication. Unauthenticated requests redirect to `/login`.

### 3.1 Feed (Job Discovery)

| Route | Page | Notes |
|---|---|---|
| `/feed` | Job feed — ranked, filterable | Match-scored list with "why this match" rationale 🔜 |
| `/feed/[id]` | Job detail | Full posting, ATS-tier badge, match breakdown, save/dismiss/start application 🔜 |
| `/feed/[id]/apply` | Application start — tailoring | Generates tailored resume + cover letter; shows diff 🔜 |
| `/feed/[id]/apply/review` | Co-pilot review screen | Field-by-field diff before submit; explicit submit CTA 🔷 |
| `/feed/saved` | Saved jobs | Subset of feed: saved-only filter |
| `/feed/dismissed` | Dismissed jobs | Manage dismissals; restore 🔜 |

### 3.2 Application Tracker

| Route | Page | Notes |
|---|---|---|
| `/tracker` | Tracker — list/kanban | All applications, status pipeline, filter/search 🔜 |
| `/tracker/[id]` | Application detail | Audit log, status history, notes, AI-generated artifacts used 🔷 |
| `/tracker/[id]/artifacts` | Artifacts for application | Tailored resume + cover letter used; diff vs. base ✅/🔜 |

### 3.3 Profile & Resumes

| Route | Page | Notes |
|---|---|---|
| `/profile` | Profile overview | Completion indicator; section summary cards ✅ |
| `/profile/personal` | Personal info | Contact, location ✅ |
| `/profile/professional` | Professional info | Headline, summary ✅ |
| `/profile/experience` | Work experience | Full CRUD; AI-sourced vs. user-confirmed provenance ✅ |
| `/profile/education` | Education | ✅ |
| `/profile/skills` | Skills & technologies | ✅ |
| `/profile/projects` | Projects | ✅ |
| `/profile/certifications` | Certifications | ✅ |
| `/profile/preferences` | Job preferences | Roles, locations, remote, salary, exclusions ✅ |
| `/resumes` | Resume manager | All versions; primary indicator; upload new; diff between versions ✅ |
| `/resumes/[id]` | Resume detail | Download, view parsed fields, delete ✅ |
| `/resumes/[id]/tailored` | Tailored variants | List of tailored variants derived from this base resume 🔜 |

### 3.4 AI Tailoring

| Route | Page | Notes |
|---|---|---|
| `/tailoring` | Tailoring history | All tailored resumes and cover letters ever generated 🔜 |
| `/tailoring/resume/[id]` | Tailored resume | Diff vs. base; edit; regenerate; version history 🔜 |
| `/tailoring/cover-letter/[id]` | Tailored cover letter | Diff; tone selector; edit; regenerate 🔜 |

### 3.5 Dashboard

| Route | Page | Notes |
|---|---|---|
| `/dashboard` | Home / dashboard | Activity summary, action cards (résumé health, pending reviews, new matches) ✅ |

### 3.6 Notifications

| Route | Page | Notes |
|---|---|---|
| `/notifications` | Notifications inbox | New matches, status changes, automation failures 🔜 |
| `/notifications/settings` | Notification preferences | Which events trigger what channel 🔶 |

### 3.7 Settings

| Route | Page | Notes |
|---|---|---|
| `/settings` | Settings root | Redirects to first section or shows summary |
| `/settings/account` | Account | Email, password change, OAuth connections ✅ |
| `/settings/security` | Security | Active sessions, MFA (future), login audit log ✅ |
| `/settings/extension` | Browser extension | Pair / unpair; device token management; mode indicator 🔷 |
| `/settings/autopilot` | Auto-pilot | Criteria (min score, daily cap, exclusions); disclosure acknowledgment; kill switch 🔶 |
| `/settings/billing` | Billing & plan | Current plan, usage, upgrade/downgrade, invoices 🔶 |
| `/settings/compliance` | Compliance Center | Export data; delete account; plain-language automation log; revoke extension 🔷 |
| `/settings/notifications` | Notification preferences | Alias / redirect of `/notifications/settings` |

---

## 4. Browser extension surfaces

Extension UI lives in the browser extension; these are not web routes. Documented here for
completeness as part of the full product IA.

| Surface | Purpose | Phase |
|---|---|---|
| Popup — unpaired | Pair-to-account CTA; link to web app | 🔷 |
| Popup — paired, co-pilot | Mode indicator; recent applications; kill switch | 🔷 |
| Popup — paired, auto-pilot | Same + live auto-pilot status + caps remaining | 🔶 |
| On-page overlay — detection | "ApplyPilot detected [ATS name]" banner with Autofill CTA | 🔷 |
| On-page overlay — co-pilot review | Field-by-field diff; per-field AI badge; Submit CTA | 🔷 |
| On-page overlay — unsupported ATS | "Manual apply only" notice; one-click tracker entry | 🔷 |

---

## 5. API routes (internal, not user-facing)

Frontend Next.js API routes (under `/api/`) and NestJS backend routes are not part of the
user-facing sitemap. Refer to `API_DESIGN.md` for that surface.

---

## 6. Error & system pages

| Route | Purpose |
|---|---|
| `/404` | Not found |
| `/500` | Internal error |
| `/maintenance` | Planned downtime banner |
| `/auth/callback` | OAuth callback handler (not user-facing; redirect only) |
| `/auth/verify` | Email verification callback (redirects to `/verify-email` or `/dashboard`) |

---

## 7. Hierarchy diagram

```
/ (marketing)
├── /signup
├── /login
├── /forgot-password → /reset-password
├── /verify-email
├── /privacy
├── /terms
├── /about
├── /changelog
└── /status

/onboarding
├── /upload
├── /review
├── /confirm
├── /preferences
├── /connect-extension
└── /done

/dashboard               ← default post-login landing

/feed
├── /saved
├── /dismissed
└── /[id]
    ├── /apply
    │   └── /review     ← co-pilot review/submit screen

/tracker
└── /[id]
    └── /artifacts

/profile
├── /personal
├── /professional
├── /experience
├── /education
├── /skills
├── /projects
├── /certifications
└── /preferences

/resumes
└── /[id]
    └── /tailored

/tailoring
├── /resume/[id]
└── /cover-letter/[id]

/notifications
└── /settings

/settings
├── /account
├── /security
├── /extension
├── /autopilot
├── /billing
└── /compliance
```

---

## 8. Route ownership by phase

| Phase | New routes introduced |
|---|---|
| ✅ Phase 0–1 (shipped) | `/`, `/signup`, `/login`, `/forgot-password`, `/reset-password`, `/verify-email`, `/privacy`, `/terms`, `/onboarding/*`, `/dashboard`, `/profile/*`, `/resumes`, `/resumes/[id]`, `/settings/account`, `/settings/security` |
| 🔜 Phase 2 | `/feed`, `/feed/[id]`, `/feed/[id]/apply`, `/feed/saved`, `/feed/dismissed`, `/tracker`, `/tracker/[id]`, `/tailoring`, `/tailoring/resume/[id]`, `/tailoring/cover-letter/[id]`, `/resumes/[id]/tailored` |
| 🔷 Phase 3 | `/feed/[id]/apply/review`, `/tracker/[id]/artifacts`, `/onboarding/connect-extension`, `/settings/extension`, `/settings/compliance` |
| 🔶 Phase 4 | `/settings/autopilot`, `/settings/billing`, `/notifications/settings` |
| 🔹 Phase 5 | `/about`, `/blog`, `/blog/[slug]`, `/changelog`, enterprise sub-paths |

---

## 9. Redirects & canonical rules

| From | To | Reason |
|---|---|---|
| `/` (authenticated) | `/dashboard` | Logged-in users skip marketing landing |
| `/onboarding` (incomplete) | First incomplete onboarding step | Resume wizard progress guard |
| `/onboarding` (complete) | `/feed` | Skip re-showing finished onboarding |
| `/settings` | `/settings/account` | Canonical first tab |
| `/notifications/settings` | `/settings/notifications` | De-duplicate settings entry point |
| `/auth/callback` | `/dashboard` or `/onboarding/upload` | Post-OAuth redirect |

---

## 10. SEO & metadata notes

- All public routes (`/`, `/about`, `/blog/*`, `/changelog`) must have unique `<title>` and
  `<meta description>` tags defined in `layout.tsx` or the page's `generateMetadata()`.
- Authenticated app routes must set `noindex, nofollow` via `robots` metadata.
- The marketing landing page (`/`) is the canonical root; all marketing assets live under
  it or its immediate siblings — no authenticated content bleeds into the public URL space.
