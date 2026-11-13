# ApplyFocus — User Flows

## 1. Sign-up & onboarding

```
Landing page --> Sign up (email or OAuth) --> Upload resume
    --> [parse] --> Review/correct parsed profile --> Set job preferences
    --> Prompt: install browser extension --> Home / job feed
```

Decision points:
- If resume parsing confidence is low on a field (e.g. dates), that field is flagged for
  the user to confirm rather than silently guessed.
- Extension install is encouraged but skippable — a user can use ApplyFocus purely as a
  tracker/tailoring tool without ever installing it.

## 2. Install & pair the browser extension

```
Web app "Connect extension" --> opens extension store listing --> user installs
    --> extension opens pairing screen --> user logs in (same account) inside extension
    --> extension receives a scoped, revocable device token --> pairing confirmed in both
        web app and extension
```

No ATS or job-board credential is ever requested during pairing. The extension only ever
acts using the browser's *existing, already-authenticated* session on whatever site the
user is currently on.

## 3. Job discovery → save/apply decision

```
Job feed (ranked by match score) --> open posting detail
    --> see "why this match" rationale + ATS tier badge
    --> [Save for later] or [Dismiss] or [Start application]
```

If `[Start application]` and the ATS tier is "unsupported": user is shown the original
posting URL only, with a one-click "mark as applied manually" tracker entry — no
automation is attempted.

## 4. Apply flow — Co-pilot mode (default for all new users)

```
Start application --> system generates tailored resume + cover letter
    --> user reviews/edits tailored content --> user opens posting in browser with
        extension active --> extension autofills detected form fields (incl. AI-drafted
        answers to open-ended questions) --> REVIEW SCREEN: full diff of every field,
        editable --> user clicks Submit --> extension submits (Tier-1 API call or
        Tier-2 in-session form submit) --> result (success/failure) written back
        to tracker with audit trail
```

Nothing is ever submitted from this flow without an explicit user click on the review
screen.

## 5. Apply flow — Auto-pilot mode (opt-in, Phase 4+)

```
Settings --> enable Auto-pilot --> set criteria (min match score, max applications/day,
    excluded companies) --> acknowledge disclosure --> ON

Background: new high-score match appears
    --> if confidence(tailoring + form-fill mapping) >= threshold AND under daily cap:
            submit automatically --> notify user after the fact with full audit entry
    --> else:
            route to co-pilot review queue instead (never silently dropped, never
            force-submitted below threshold)

User can hit the kill switch at any time --> all pending auto-pilot actions pause
    immediately; already-submitted ones are unaffected but still visible in the audit log.
```

## 6. Application tracking & status update

```
Tracker view (list/kanban) --> application card shows current status
    --> user can manually drag/change status (e.g. mark "Interview") and add a note
    --> status history is preserved (who/what changed it and when)
```

## 7. Resume / cover letter edit & regenerate

```
Posting detail --> "Regenerate tailored resume" --> system produces new variant from the
    same base resume + posting --> diff shown against both the base resume and the
    previous tailored variant --> user accepts or discards
```

## 8. Settings — pause automation / revoke extension / delete data

```
Settings --> Compliance Center -->
    [Pause all automation] (immediate, reversible)
    [Revoke extension pairing] (extension loses its token immediately)
    [Export my data] (resumes, profile, application history as a downloadable archive)
    [Delete my account] --> confirmation --> cascading deletion of profile, resumes,
        tailored content, and application history; audit logs are retained in anonymized
        form only as required for abuse/security investigation, per retention policy
```
