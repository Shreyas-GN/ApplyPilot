-- =============================================================================
-- APPLYFOCUS PRODUCTION MIGRATION
-- Applies: 0008_job_boards_closure + 0009_india_job_intel
-- Generated from exact migration SQL files and journal timestamps.
-- Safe to run once; idempotent guard prevents double-application.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- PREFLIGHT: Abort if 0007 is not recorded (unexpected baseline)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM drizzle.__drizzle_migrations
    WHERE hash = 'b5a9aa5d913072e57f0af3d42a52632ceff66e20d23e3eede1f0e03d2e063a04'
  ) THEN
    RAISE EXCEPTION
      'PREFLIGHT FAILED: Expected migration 0007_right_franklin_storm '
      '(hash b5a9aa5d...) not found in __drizzle_migrations. '
      'Do not proceed — verify the production migration baseline first.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PREFLIGHT: Abort if 0008 or 0009 are already recorded
-- (prevents double-application if the script is re-run after partial success)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM drizzle.__drizzle_migrations
    WHERE hash IN (
      '33494daf5cebe0867c44981e080d543c11a38f13dbf062dbad3eaa466c5e1de7',
      'aca419797f6b66534bbd0ef634e799d201e1b29a0c32af2063f505c455692132'
    )
  ) THEN
    RAISE EXCEPTION
      'PREFLIGHT FAILED: 0008 or 0009 migration records already exist. '
      'This script has already been applied. Do not re-run.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PREFLIGHT: Abort if job_boards already exists
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'job_boards'
  ) THEN
    RAISE EXCEPTION
      'PREFLIGHT FAILED: job_boards table already exists. '
      'Schema is ahead of migration records — investigate before proceeding.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- PREFLIGHT: Abort if any Phase 1 or Phase 2 columns already exist on jobs
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  col_count integer;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'jobs'
    AND column_name IN (
      'is_active', 'closed_at', 'miss_count',
      'normalized_location', 'location_country', 'is_india_remote',
      'salary_min', 'salary_max', 'salary_currency', 'salary_period',
      'salary_text', 'experience_level', 'experience_text'
    );
  IF col_count > 0 THEN
    RAISE EXCEPTION
      'PREFLIGHT FAILED: % target column(s) already exist on jobs table. '
      'Schema is ahead of migration records — investigate before proceeding.',
      col_count;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- MIGRATION 0008: 0008_job_boards_closure
-- Creates job_boards table and adds closure-tracking columns to jobs.
-- ---------------------------------------------------------------------------

CREATE TABLE "job_boards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider" text NOT NULL,
  "slug" text NOT NULL,
  "company_name" text NOT NULL,
  "is_enabled" boolean DEFAULT true NOT NULL,
  "last_synced_at" timestamp with time zone,
  "error_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "jobs" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;
ALTER TABLE "jobs" ADD COLUMN "closed_at" timestamp with time zone;
ALTER TABLE "jobs" ADD COLUMN "miss_count" integer DEFAULT 0 NOT NULL;

CREATE UNIQUE INDEX "job_boards_provider_slug_idx"
  ON "job_boards" USING btree ("provider", "slug");

CREATE INDEX "job_boards_enabled_idx"
  ON "job_boards" USING btree ("is_enabled");

-- Record 0008 in Drizzle migration history
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
VALUES (
  '33494daf5cebe0867c44981e080d543c11a38f13dbf062dbad3eaa466c5e1de7',
  1794590892637
);

-- ---------------------------------------------------------------------------
-- MIGRATION 0009: 0009_india_job_intel
-- Adds India-specific location, salary and experience intelligence columns.
-- ---------------------------------------------------------------------------

ALTER TABLE "jobs" ADD COLUMN "normalized_location" text;
ALTER TABLE "jobs" ADD COLUMN "location_country" text;
ALTER TABLE "jobs" ADD COLUMN "is_india_remote" boolean;
ALTER TABLE "jobs" ADD COLUMN "salary_min" integer;
ALTER TABLE "jobs" ADD COLUMN "salary_max" integer;
ALTER TABLE "jobs" ADD COLUMN "salary_currency" text;
ALTER TABLE "jobs" ADD COLUMN "salary_period" text;
ALTER TABLE "jobs" ADD COLUMN "salary_text" text;
ALTER TABLE "jobs" ADD COLUMN "experience_level" text;
ALTER TABLE "jobs" ADD COLUMN "experience_text" text;

CREATE INDEX "jobs_experience_level_idx"
  ON "jobs" USING btree ("experience_level");

CREATE INDEX "jobs_location_country_idx"
  ON "jobs" USING btree ("location_country");

-- Record 0009 in Drizzle migration history
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
VALUES (
  'aca419797f6b66534bbd0ef634e799d201e1b29a0c32af2063f505c455692132',
  1794637088165
);

-- ---------------------------------------------------------------------------
-- POST-FLIGHT: Verify all 13 columns landed on jobs
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  col_count integer;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'jobs'
    AND column_name IN (
      'is_active', 'closed_at', 'miss_count',
      'normalized_location', 'location_country', 'is_india_remote',
      'salary_min', 'salary_max', 'salary_currency', 'salary_period',
      'salary_text', 'experience_level', 'experience_text'
    );
  IF col_count <> 13 THEN
    RAISE EXCEPTION
      'POST-FLIGHT FAILED: Expected 13 new jobs columns, found %. Rolling back.',
      col_count;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- POST-FLIGHT: Verify job_boards table exists
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'job_boards'
  ) THEN
    RAISE EXCEPTION 'POST-FLIGHT FAILED: job_boards table not found. Rolling back.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- POST-FLIGHT: Verify both migration records were inserted
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  rec_count integer;
BEGIN
  SELECT COUNT(*) INTO rec_count
  FROM drizzle.__drizzle_migrations
  WHERE hash IN (
    '33494daf5cebe0867c44981e080d543c11a38f13dbf062dbad3eaa466c5e1de7',
    'aca419797f6b66534bbd0ef634e799d201e1b29a0c32af2063f505c455692132'
  );
  IF rec_count <> 2 THEN
    RAISE EXCEPTION
      'POST-FLIGHT FAILED: Expected 2 new migration records, found %. Rolling back.',
      rec_count;
  END IF;
END $$;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (run after COMMIT to confirm state)
-- =============================================================================
-- Uncomment and run each block separately in Supabase SQL Editor.
--
-- -- Migration history (expect 10 rows, last two are 0008 and 0009)
-- SELECT id, hash, to_timestamp(created_at / 1000.0) AS applied_at
-- FROM drizzle.__drizzle_migrations
-- ORDER BY created_at;
--
-- -- job_boards table (expect 1 row)
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name = 'job_boards';
--
-- -- Phase 1 columns on jobs (expect 3 rows)
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'jobs'
--   AND column_name IN ('is_active', 'closed_at', 'miss_count')
-- ORDER BY column_name;
--
-- -- Phase 2 columns on jobs (expect 10 rows)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'jobs'
--   AND column_name IN (
--     'normalized_location', 'location_country', 'is_india_remote',
--     'salary_min', 'salary_max', 'salary_currency', 'salary_period',
--     'salary_text', 'experience_level', 'experience_text'
--   )
-- ORDER BY column_name;
