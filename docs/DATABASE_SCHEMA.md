# ApplyPilot — Database Schema

PostgreSQL + `pgvector`. All PII-bearing tables scoped by `user_id` and covered by
Row-Level Security as defense in depth (see `SYSTEM_ARCHITECTURE.md` §5).

> **Phase 1 note:** this document is now kept in sync with the actual Prisma schema
> (`apps/api/prisma/schema.prisma`), not just the Phase 0 design. Changes from the
> original design, made while implementing auth/profile/resumes:
> - `profiles.links` (one JSON blob) became explicit columns: `linkedin_url`, `github_url`,
>   `portfolio_url`, plus new columns for `headline`, `summary`, `years_of_experience`,
>   `employment_status`, and the job-preference fields — all queryable/validatable
>   individually instead of opaque JSON.
> - `profiles.parsed_experience` / `parsed_education` / `parsed_skills` (JSON blobs) were
>   replaced by real relational tables (`work_experiences`, `education_entries`, `skills`,
>   plus new `projects` and `certifications` tables) — each row tagged `source` (`user` /
>   `ai`) and `confidence`, per the "keep AI-generated and user-confirmed data
>   distinguishable" requirement.
> - `resumes.file_url` (a stored URL) became `storage_key` (an opaque object-storage key) —
>   download URLs are generated on demand, short-lived, and signed (see `API_DESIGN.md`),
>   never persisted.
> - `resumes.parsed_json` was replaced by a dedicated `resume_parsed_data` table (plus
>   `resume_parsing_jobs` for the async pipeline's own status) — see §2 below.
> - Added for auth: `refresh_tokens`, `email_verification_tokens`, `password_reset_tokens`.
> - Added for observability: `audit_logs` (general security/account events — distinct from
>   `application_events`, which remains an Application-domain concern for Phase 3+).

## 1. Entity overview

```
users 1──1 profiles
users 1──* refresh_tokens
users 1──* email_verification_tokens
users 1──* password_reset_tokens
users 1──* work_experiences
users 1──* education_entries
users 1──* skills
users 1──* projects
users 1──* certifications
users 1──* resumes
users 1──* audit_logs
resumes 1──1 resume_parsing_jobs
resumes 1──1 resume_parsed_data
users 1──* cover_letter_templates
users 1──* matches ──* jobs
users 1──* applications ──1 jobs
applications 1──* application_events
jobs 1──1 job_embeddings
users 1──* extension_sessions
users 1──* notifications
users 1──1 subscriptions
users 1──* consent_logs
ats_connectors (reference table, not user-scoped)
```

## 2. Tables

### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | text, unique | |
| password_hash | text, nullable | null if OAuth-only |
| auth_provider | text | `password` / `google` / etc. |
| status | text | active / suspended / deleted |
| email_verified_at | timestamptz, nullable | |
| created_at | timestamptz | |

### `refresh_tokens`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| token_hash | text, unique | SHA-256 of the opaque token; raw token never stored |
| expires_at | timestamptz | |
| revoked_at | timestamptz, nullable | set on rotation, logout, or reuse-detected session kill |
| replaced_by_token_id | uuid, nullable | rotation chain, for audit/debugging |
| user_agent | text, nullable | |
| ip_address | text, nullable | |
| created_at | timestamptz | |

### `email_verification_tokens` / `password_reset_tokens`
Same shape, two tables: `id`, `user_id` (FK users), `token_hash` (unique), `expires_at`,
`consumed_at` (nullable, single-use), `created_at`. Raw tokens never stored — only their
SHA-256 hash, matching `refresh_tokens`.

### `profiles`
| Column | Type | Notes |
|---|---|---|
| user_id | uuid PK, FK users | |
| full_name | text, nullable | |
| phone | text, nullable | |
| location | text, nullable | |
| linkedin_url | text, nullable | |
| github_url | text, nullable | |
| portfolio_url | text, nullable | |
| headline | text, nullable | |
| summary | text, nullable | |
| years_of_experience | int, nullable | |
| employment_status | text, nullable | |
| preferred_titles | text[] | |
| preferred_locations | text[] | |
| work_mode | text, nullable | `remote` / `hybrid` / `onsite` |
| employment_types | text[] | `full_time` / `part_time` / `contract` / `internship` / `freelance` |
| expected_salary_min | int, nullable | |
| expected_salary_max | int, nullable | |
| preferred_industries | text[] | |
| excluded_companies | text[] | |
| updated_at | timestamptz | |

Created automatically (empty) alongside the `users` row at registration — every user has
exactly one `profiles` row for its lifetime, never created lazily on first access.

### `work_experiences` / `education_entries` / `projects` / `certifications`
Four structurally similar tables, each `user_id`-scoped (FK users, indexed), each row
tagged:
- `source` (text, default `user`): `user` for anything entered/edited through the profile
  UI, `ai` only for entries still exactly as AI resume-parsing produced them and not yet
  touched by a manual edit.
- `confidence` (decimal(4,3), nullable): the parser's confidence for `ai`-sourced entries;
  null for `user`-sourced ones.

| Table | Domain-specific columns |
|---|---|
| `work_experiences` | `company`, `title`, `location`, `start_date`, `end_date`, `is_current` (bool), `description` |
| `education_entries` | `institution`, `degree`, `field_of_study`, `start_date`, `end_date`, `description` |
| `projects` | `name`, `description`, `url`, `start_date`, `end_date` |
| `certifications` | `name`, `issuer`, `issue_date`, `expiry_date`, `credential_url` |

Each also has `id` (uuid PK), `created_at`, and (except `certifications`) `updated_at`.

### `skills`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| name | text | |
| category | text, nullable | |
| source | text | `user` / `ai` |
| confidence | decimal(4,3), nullable | |
| created_at | timestamptz | |
| (unique) | (user_id, name) | case-sensitive at the DB level; the API layer dedupes case-insensitively before insert |

### `resumes`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| version_label | text | user-facing label; defaults to the original filename |
| original_filename | text | |
| mime_type | text | `application/pdf` or the DOCX OOXML mime type |
| file_size_bytes | int | |
| storage_key | text | opaque object-storage key (not a URL — see `API_DESIGN.md` §"download-url") |
| checksum | text, nullable | SHA-256 of the file content |
| is_primary | boolean | first resume a user uploads becomes primary automatically |
| processing_status | text | `uploaded` → `extracting` → `extracted` → `parsing` → `parsed`, or `failed` at any stage |
| extracted_text | text, nullable | deterministic PDF/DOCX text extraction output |
| processing_error | text, nullable | set when `processing_status = failed` |
| source_application_id | uuid, nullable FK applications | set if this is a tailored variant generated for a specific application (Phase 3+) |
| created_at | timestamptz | |

### `resume_parsing_jobs`
One row per resume, tracking the async pipeline's own lifecycle (distinct from
`resumes.processing_status`, which is the user-facing summary).

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| resume_id | uuid, unique FK resumes | |
| status | text | `queued` / `processing` / `completed` / `failed` |
| attempts | int | |
| error | text, nullable | |
| started_at | timestamptz, nullable | |
| completed_at | timestamptz, nullable | |
| created_at | timestamptz | |

### `resume_parsed_data`
The AI-parsing pipeline's output — one row per resume (overwritten on re-parse, not
versioned).

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| resume_id | uuid, unique FK resumes | |
| structured_data | jsonb | the full parsed payload (personal info + experience/education/skills/projects/certifications arrays), validated against the strict schema in `packages/validators/src/resumeParsedData.ts` before being written here |
| overall_confidence | decimal(4,3), nullable | |
| review_status | text | `pending_review` → `confirmed` |
| confirmed_at | timestamptz, nullable | |
| created_at / updated_at | timestamptz | |

`PATCH /resumes/:id/parsed-data` overwrites `structured_data` in place (the user's
corrections); `POST /resumes/:id/confirm` is what copies it out into the relational
`work_experiences`/`education_entries`/`skills`/`projects`/`certifications` tables (full
replace of those sections, not an accumulating merge — see `AI_AGENTS.md`) and flips
`review_status` to `confirmed`.

### `audit_logs`
General security/account event log — registration, login success/failure, logout, token
refresh (including reuse-detected session kills), password reset, email verification,
profile updates, resume upload/delete/confirm. Distinct from `application_events`, which
remains scoped to the Application domain (Phase 3+).

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid, nullable FK users | nullable so a failed-login-on-unknown-email can still be logged without a user to attach to |
| action | text | see `AuditAction` in `packages/shared` |
| metadata | jsonb, nullable | |
| ip_address | text, nullable | |
| user_agent | text, nullable | |
| created_at | timestamptz | |
| (index) | (user_id, created_at) | |

### `cover_letter_templates`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| tone | text | formal / conversational / concise |
| content | text | base template/style sample, not a submitted letter |

### `jobs`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| source | text | `greenhouse` / `lever` / `generic` |
| external_id | text | id on the source system |
| ats_type | text | FK-like reference to `ats_connectors.name` |
| title | text | |
| company | text | |
| location | text | |
| description_raw | text | |
| apply_url | text | |
| posted_at | timestamptz | |
| ingested_at | timestamptz | |
| raw_json | jsonb | original payload, for debugging/re-processing |
| (unique) | (source, external_id) | dedupe key |

### `job_embeddings`
| Column | Type | Notes |
|---|---|---|
| job_id | uuid PK, FK jobs | |
| embedding | vector(1536) | pgvector; dims per chosen embedding model |
| model_version | text | so re-embedding on model change is trackable |

### `matches`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| job_id | uuid FK jobs | |
| score | numeric | |
| rationale | text | human-readable, grounded explanation |
| status | text | new / saved / dismissed / applied |
| created_at | timestamptz | |
| (unique) | (user_id, job_id) | |
| (index) | (user_id, status, score desc) | feed query pattern |

### `applications`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| job_id | uuid FK jobs | |
| mode | text | `copilot` / `autopilot` |
| ats_tier | text | `native` / `best_effort` / `unsupported` |
| status | text | queued / pending_review / submitted / failed / interview / rejected / offer / withdrawn |
| tailored_resume_id | uuid, nullable FK resumes | |
| tailored_cover_letter | text, nullable | generated content, stored directly (short text) |
| confidence_score | numeric, nullable | used for auto-pilot threshold decisions |
| submitted_at | timestamptz, nullable | |
| failure_reason | text, nullable | |
| created_at | timestamptz | |
| (index) | (user_id, status) | tracker query pattern |

### `application_events` (append-only audit trail)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| application_id | uuid FK applications | |
| event_type | text | `field_filled` / `status_changed` / `submitted` / `failed` / `ai_draft_generated` |
| payload | jsonb | field name/value, old/new status, error detail, etc. |
| actor | text | `system` / `extension` / `user` |
| created_at | timestamptz | |
| (index) | (application_id, created_at) | |

This table is the backing data for the Compliance Center's plain-language activity log
(`UI_UX.md` §3) — it is a product surface, not just an internal log.

### `ats_connectors` (reference/config table)
| Column | Type | Notes |
|---|---|---|
| name | text PK | e.g. `greenhouse`, `lever`, `workday`, `generic` |
| tier | text | `native` / `best_effort` / `unsupported` |
| config | jsonb | API base URLs, field-mapping rules, rate limits |
| enabled | boolean | lets ops demote a connector instantly if it breaks |
| updated_at | timestamptz | |

### `extension_sessions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| device_label | text | e.g. "Chrome — MacBook" |
| token_hash | text | hashed device token, not the raw token |
| scopes | text[] | e.g. `['sync', 'apply']` |
| last_seen_at | timestamptz | |
| status | text | active / revoked |

Deliberately **no credential fields** — this table only tracks pairing/session metadata,
never third-party ATS credentials, per the architecture decision in
`SYSTEM_ARCHITECTURE.md` §2.

### `notifications`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| type | text | `new_match` / `status_change` / `automation_failure` |
| payload | jsonb | |
| read_at | timestamptz, nullable | |
| created_at | timestamptz | |

### `subscriptions`
| Column | Type | Notes |
|---|---|---|
| user_id | uuid PK, FK users | |
| plan | text | free / pro / power |
| status | text | active / past_due / canceled |
| billing_provider_customer_id | text | e.g. Stripe customer id |
| current_period_end | timestamptz | |

### `consent_logs`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| consent_type | text | `extension_pairing` / `autopilot_enabled` / `data_processing` |
| granted_at | timestamptz | |
| revoked_at | timestamptz, nullable | |

## 3. Retention & deletion

On account deletion: `profiles`, `resumes`, `cover_letter_templates`, `matches`,
`applications`, `extension_sessions`, `notifications`, `subscriptions` are hard-deleted
(not soft-deleted) within the documented retention window.
`application_events` are anonymized (user/application identifiers stripped) rather than
deleted outright, retained only as long as required for abuse/security investigation, per
`SYSTEM_ARCHITECTURE.md` §8.

## 4. Indexing notes

- `job_embeddings.embedding`: HNSW or IVFFlat index (pgvector) for nearest-neighbor
  matching queries.
- `jobs`: GIN index on `to_tsvector(title || description_raw)` for keyword search.
- `matches(user_id, status, score desc)` and `applications(user_id, status)`: composite
  indexes for the two highest-traffic read patterns (feed, tracker).
