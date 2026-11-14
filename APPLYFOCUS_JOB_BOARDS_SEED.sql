-- =============================================================================
-- APPLYFOCUS JOB BOARDS SEED
-- Idempotent: ON CONFLICT DO NOTHING — safe to re-run at any time.
-- Prerequisites: migrations 0008 and 0009 must already be applied.
-- =============================================================================
-- Table: job_boards (provider text, slug text, company_name text,
--                    is_enabled boolean, UNIQUE(provider, slug))
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PREFLIGHT: Confirm job_boards table exists before seeding
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'job_boards'
  ) THEN
    RAISE EXCEPTION
      'PREFLIGHT FAILED: job_boards table not found. '
      'Apply migrations 0008 and 0009 before running this seed.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- SEED: 4 verified boards (enabled) + 6 candidate boards (disabled)
--
-- Enabled = slugs already exercised by application code and confirmed
-- present in DEFAULT_BOARDS in apps/web/lib/server/jobs.ts.
--
-- Disabled = well-known Greenhouse companies; enable manually after
-- verifying their public boards endpoint responds correctly:
--   https://boards-api.greenhouse.io/v1/boards/{slug}/jobs
-- ---------------------------------------------------------------------------

INSERT INTO job_boards (provider, slug, company_name, is_enabled)
VALUES
  -- Verified (were in DEFAULT_BOARDS)
  ('greenhouse', 'vercel',         'Vercel',         true),
  ('greenhouse', 'anthropic',      'Anthropic',      true),
  ('greenhouse', 'stripe',         'Stripe',         true),
  ('greenhouse', 'figma',          'Figma',          true),
  -- Candidates — disabled until you verify their endpoint returns jobs
  ('greenhouse', 'notion',         'Notion',         false),
  ('greenhouse', 'linear',         'Linear',         false),
  ('greenhouse', 'brex',           'Brex',           false),
  ('greenhouse', 'ramp',           'Ramp',           false),
  ('greenhouse', 'plaid',          'Plaid',          false),
  ('greenhouse', 'retool',         'Retool',         false)
ON CONFLICT (provider, slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- POST-FLIGHT: Show what is now in the table
-- ---------------------------------------------------------------------------
SELECT provider, slug, company_name, is_enabled, created_at
FROM   job_boards
ORDER  BY is_enabled DESC, company_name;
