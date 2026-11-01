# ApplyPilot — Database Schema

PostgreSQL + `pgvector`. All PII-bearing tables scoped by `user_id` and covered by
Row-Level Security as defense in depth (see `SYSTEM_ARCHITECTURE.md` §5).

## 1. Entity overview

```
users 1──1 profiles
users 1──* resumes
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
| created_at | timestamptz | |

### `profiles`
| Column | Type | Notes |
|---|---|---|
| user_id | uuid PK, FK users | |
| full_name | text | |
| phone | text, encrypted | |
| location | text | |
| links | jsonb | LinkedIn/portfolio/etc. |
| parsed_experience | jsonb | structured work history from resume parsing |
| parsed_education | jsonb | |
| parsed_skills | jsonb | |
| preferences | jsonb | target roles, locations, salary floor, exclusions |
| updated_at | timestamptz | |

### `resumes`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users | |
| version_label | text | e.g. "Base", "Tailored — Acme SWE" |
| file_url | text | object storage pointer |
| parsed_json | jsonb | structured extraction at time of upload/generation |
| is_primary | boolean | one primary base resume per user |
| source_application_id | uuid, nullable FK applications | set if this is a tailored variant generated for a specific application |
| created_at | timestamptz | |

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
