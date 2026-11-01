# ApplyPilot — UI/UX Guidelines

No Tsenta (or any competitor) visual assets, branding, copy, or layouts are referenced or
copied here — per `REVERSE_ENGINEERING.md` we never actually saw Tsenta's real UI, and
regardless, this is an original design. This document defines principles and a screen
inventory; actual visual design (typography, color system, component library) is a
separate design-track deliverable, not decided in this document.

## 1. Design principles

1. **Control and trust over cleverness.** Automation is powerful and therefore must be
   legible: the user should always be able to answer "what did it just do, and why."
2. **Review is a first-class UI pattern, not friction to minimize away.** The
   review-before-submit diff screen (see `USER_FLOWS.md` §4) is a core, polished surface —
   not an afterthought checkbox.
3. **Honesty in AI-generated content.** Tailored resumes/cover letters are visually marked
   as AI-assisted drafts until the user accepts them; nothing is silently "final."
4. **Progressive disclosure.** Auto-pilot, Tier-2 automation, and advanced filters are
   opt-in surfaces revealed after a user has built trust in co-pilot mode, not thrown at
   a first-time user.
5. **Accessibility is a requirement, not a polish pass**: WCAG 2.1 AA minimum (keyboard
   navigation, color contrast, screen-reader labeling of dynamic diff/status content).

## 2. Information architecture

```
Home (job feed / dashboard)
├── Job Feed
│   └── Job Detail
│       └── Application Review (diff screen)
├── Tracker (list/kanban of applications)
│   └── Application Detail (audit log, notes, status history)
├── Profile
│   ├── Resumes (versions)
│   ├── Preferences
│   └── Cover letter tone settings
├── Notifications
└── Settings
    ├── Compliance Center (export/delete/automation log)
    ├── Extension pairing
    └── Billing
```

Browser extension surfaces (separate, lighter UI):
```
Extension popup
├── Status (paired/unpaired, co-pilot/auto-pilot indicator)
├── On-page overlay (when a supported job page is detected)
└── Review screen (diff, same data model as web app's Application Review)
```

## 3. Screen inventory & key states

| Screen | Purpose | Notable states |
|---|---|---|
| Onboarding wizard | Resume upload → parse → confirm → preferences | Low-confidence-parse flag state; empty-preferences state |
| Job Feed | Ranked, filterable list of matched postings | Loading skeleton; empty ("no matches yet, broaden filters"); stale-data banner if ingestion lagging |
| Job Detail | Full posting + match rationale + ATS tier badge | Unsupported-ATS state (manual-apply only, no automation offered) |
| Application Review (diff) | Field-by-field review before submit | Per-field "AI-drafted" badge on open-ended answers; error state per field if extension couldn't map it (user fills manually inline) |
| Tracker | Pipeline view of all applications | Failed-submission state surfaces the reason + a retry/edit action, never a silent drop |
| Resume Manager | Multiple resume versions, diffs between tailored variants | Side-by-side diff view; "regenerate" with previous-version comparison |
| Compliance Center | Export/delete/automation activity log | Plain-language log entries ("Applied to X at Company Y via Greenhouse API, 2:03pm") |
| Auto-pilot setup | Criteria + caps + disclosure | Explicit acknowledgment step before toggle activates; always-visible kill switch once on |
| Extension popup | At-a-glance pairing/mode status | Unpaired state with clear re-pair CTA; paused state when kill switch is active |

## 4. Interaction patterns

- **Diffs, not walls of text.** Anywhere tailored content is shown, render it as an
  inline diff against the base version, not two separate blobs the user has to compare
  manually.
- **Every automated/AI action is timestamped and attributable** in the UI, not just in
  backend logs — this is a trust feature, not just an audit feature.
- **Destructive/irreversible actions** (delete account, revoke extension mid-auto-pilot
  run) get an explicit confirmation step describing the consequence in plain language.
- **Failures degrade to a human-actionable state**, never a dead end: a failed Tier-2
  autofill surfaces exactly which fields it couldn't map, pre-filled for manual completion.

## 5. Responsive/platform notes

- Web app: desktop-first (most job applications happen at a desk), but functional down to
  tablet width for review-on-the-go.
- Extension: popup + on-page overlay only; no full-page takeover of the host site beyond
  the review modal.
