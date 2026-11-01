# ApplyPilot

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
- [`MVP_ROADMAP.md`](docs/MVP_ROADMAP.md) — phased build plan (this repo is at Phase 0)

## Project structure

```
apps/
  web/         Next.js — candidate-facing web app
  api/         NestJS — core API (auth, profile, jobs, applications, billing)
  extension/   Manifest V3 browser extension — the "Apply Assistant"
  workers/     BullMQ background workers (ingestion, matching, tailoring, notifications)
packages/
  shared/      Shared TypeScript types/enums
  validators/  Shared Zod schemas
  config/      Shared tsconfig presets
services/
  ai/          Python (FastAPI) — AI pipelines (resume parsing, matching, tailoring)
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

## Status

Phase 0 (Foundation) — see [`MVP_ROADMAP.md`](docs/MVP_ROADMAP.md). No product features
(auth, job discovery, tailoring, automation) are implemented yet.
