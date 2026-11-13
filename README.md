# ApplyFocus

AI-powered job search and application automation platform. Discover relevant
opportunities, match your skills, tailor resumes, generate cover letters, automate
applications, and track your entire job search from one place.

## Documentation

Product and engineering docs live in [`docs/`](docs/):

- [`PRODUCT_REQUIREMENTS.md`](docs/PRODUCT_REQUIREMENTS.md) — vision, personas, requirements
- [`REVERSE_ENGINEERING.md`](docs/REVERSE_ENGINEERING.md) — category research, verified vs. assumed
- [`FEATURES.md`](docs/FEATURES.md) · [`USER_FLOWS.md`](docs/USER_FLOWS.md) · [`UI_UX.md`](docs/UI_UX.md)
- [`SYSTEM_ARCHITECTURE.md`](docs/SYSTEM_ARCHITECTURE.md) · [`DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) · [`API_DESIGN.md`](docs/API_DESIGN.md)
- [`AI_AGENTS.md`](docs/AI_AGENTS.md) — the AI pipelines and their guardrails
- [`MVP_ROADMAP.md`](docs/MVP_ROADMAP.md) — phased build plan (Phase 0 and Phase 1 are complete)

## Project structure

```
apps/
  web/         Next.js — candidate-facing web app
  api/         NestJS — core API (auth, profile, resumes; jobs/applications/billing come later)
  extension/   Manifest V3 browser extension skeleton — no automation logic yet (Phase 3)
  workers/     BullMQ background workers (resume parsing today; ingestion/tailoring later)
packages/
  shared/      Shared TypeScript types/enums
  validators/  Shared Zod schemas (also the source of truth apps/web uses for client-side validation)
services/
  ai/          Python (FastAPI) — resume parsing today (mock + optional Claude provider); matching/tailoring later
infrastructure/
  docker/      Per-app Dockerfiles
  terraform/   Placeholder — no cloud provider chosen yet (see its README)
docs/          Product and architecture documentation
```

## Getting started (local development)

Requirements: Node 22+, pnpm (via `corepack enable`), Python 3.12+, and either Docker or
local Postgres 16 (+ the `vector` extension) and Redis.

```bash
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

This starts `web` (http://localhost:3000), `api` (http://localhost:3001, health check at
`/api/v1/health`), and `workers`. For the AI service:

```bash
cd services/ai
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

Or run everything containerized: `docker compose up --build` (requires a real Postgres
password/secret setup for anything beyond local dev — see `.env.example`).

Once running, you can sign up at http://localhost:3000/signup and go through the full
flow: onboarding → upload a resume → review the AI-extracted data → confirm → see it
reflected in your profile. With no `ANTHROPIC_API_KEY` set, resume parsing uses a
deterministic mock provider (extracts email/phone/links via regex, never invents
experience) — set `ANTHROPIC_API_KEY` in `.env` to use Claude instead.

### Running the tests

```bash
pnpm test            # everything, via Turborepo
pnpm --filter @applyfocus/api test       # backend only — needs a real Postgres (applyfocus_test
                                          # database, not applyfocus_dev) + Redis; see DATABASE_URL
                                          # in .env.example
pnpm --filter @applyfocus/web test       # frontend component tests — fully mocked, no services needed
cd services/ai && pytest                 # AI service tests
```

The backend integration tests (`apps/api/test/app.e2e-spec.ts`) run against a real,
separate `applyfocus_test` database — create it once with the same migrations as
`applyfocus_dev` (`DATABASE_URL=postgresql://.../applyfocus_test pnpm --filter
@applyfocus/api exec prisma migrate deploy`). They clean up every user they create.

## Status

**Phase 0 (Foundation) and Phase 1 (Auth, Profile, Resumes) are complete** — see
[`MVP_ROADMAP.md`](docs/MVP_ROADMAP.md) for what shipped. A user can register, verify
their email, manage a full candidate profile (experience, education, skills, projects,
certifications, job preferences), upload multiple resume versions, have them parsed by AI
with every field reviewable and correctable before anything touches their profile, and
manage their account — all enforced with strict per-user data isolation and backed by 35
backend + 15 frontend automated tests.

Job discovery, matching, tailoring, the extension's actual automation, and billing are not
implemented yet (Phase 2+).
