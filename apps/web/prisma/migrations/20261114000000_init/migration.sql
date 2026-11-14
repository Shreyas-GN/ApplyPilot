-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "resume_processing_status" AS ENUM ('uploaded', 'extracting', 'parsing', 'parsed', 'failed');

-- CreateEnum
CREATE TYPE "review_status" AS ENUM ('pending_review', 'confirmed', 'rejected');

-- CreateEnum
CREATE TYPE "item_source" AS ENUM ('user', 'ai');

-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('saved', 'applied', 'interviewing', 'offer', 'rejected');

-- CreateEnum
CREATE TYPE "job_state" AS ENUM ('saved', 'dismissed');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "full_name" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "linkedin_url" TEXT,
    "github_url" TEXT,
    "portfolio_url" TEXT,
    "headline" TEXT,
    "summary" TEXT,
    "years_of_experience" INTEGER,
    "employment_status" TEXT,
    "preferred_titles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferred_locations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "work_mode" TEXT,
    "employment_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expected_salary_min" INTEGER,
    "expected_salary_max" INTEGER,
    "preferred_industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excluded_companies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contact_email" TEXT,
    "career_stage" TEXT,
    "preferred_experience_level" TEXT,
    "desired_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "adjacent_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excluded_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "intelligence_metadata" JSONB,
    "notification_preferences" JSONB,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_experiences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" "item_source" NOT NULL DEFAULT 'user',
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_entries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT,
    "field_of_study" TEXT,
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "graduation_year" INTEGER,
    "grade" TEXT,
    "description" TEXT,
    "source" "item_source" NOT NULL DEFAULT 'user',
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "proficiency" TEXT,
    "years_of_experience" DOUBLE PRECISION,
    "evidence" TEXT,
    "source" "item_source" NOT NULL DEFAULT 'user',
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "role" TEXT,
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contributions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "url" TEXT,
    "github_url" TEXT,
    "live_url" TEXT,
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "source" "item_source" NOT NULL DEFAULT 'user',
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "issue_date" TIMESTAMPTZ,
    "expiry_date" TIMESTAMPTZ,
    "credential_url" TEXT,
    "source" "item_source" NOT NULL DEFAULT 'user',
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "version_label" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "checksum" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "processing_status" "resume_processing_status" NOT NULL DEFAULT 'uploaded',
    "parse_attempts" INTEGER NOT NULL DEFAULT 0,
    "extracted_text" TEXT,
    "processing_error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_parsed_data" (
    "id" UUID NOT NULL,
    "resume_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "structured_data" JSONB NOT NULL,
    "overall_confidence" DOUBLE PRECISION,
    "review_status" "review_status" NOT NULL DEFAULT 'pending_review',
    "confirmed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_parsed_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "work_mode" TEXT,
    "employment_type" TEXT,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "posted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "job_id" UUID,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "url" TEXT,
    "status" "application_status" NOT NULL DEFAULT 'saved',
    "match_score" INTEGER,
    "notes" TEXT,
    "follow_up_at" TIMESTAMPTZ,
    "checklist" JSONB,
    "applied_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_events" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tailored_documents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "job_id" UUID,
    "application_id" UUID,
    "company" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tone" TEXT,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tailored_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extension_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Chrome Extension',
    "token_hash" TEXT NOT NULL,
    "last_used_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extension_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_states" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "state" "job_state" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_boards" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "job_boards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_experiences_user_id_idx" ON "work_experiences"("user_id");

-- CreateIndex
CREATE INDEX "education_entries_user_id_idx" ON "education_entries"("user_id");

-- CreateIndex
CREATE INDEX "skills_user_id_idx" ON "skills"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "skills_user_id_name_key" ON "skills"("user_id", "name");

-- CreateIndex
CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");

-- CreateIndex
CREATE INDEX "certifications_user_id_idx" ON "certifications"("user_id");

-- CreateIndex
CREATE INDEX "resumes_user_id_idx" ON "resumes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "resume_parsed_data_resume_id_key" ON "resume_parsed_data"("resume_id");

-- CreateIndex
CREATE INDEX "resume_parsed_data_user_id_idx" ON "resume_parsed_data"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "jobs_company_idx" ON "jobs"("company");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_source_external_id_key" ON "jobs"("source", "external_id");

-- CreateIndex
CREATE INDEX "applications_user_id_idx" ON "applications"("user_id");

-- CreateIndex
CREATE INDEX "application_events_app_id_idx" ON "application_events"("application_id");

-- CreateIndex
CREATE INDEX "tailored_documents_user_id_idx" ON "tailored_documents"("user_id");

-- CreateIndex
CREATE INDEX "tailored_documents_user_job_idx" ON "tailored_documents"("user_id", "job_id");

-- CreateIndex
CREATE INDEX "extension_sessions_user_id_idx" ON "extension_sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "extension_sessions_token_hash_key" ON "extension_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "job_states_user_state_idx" ON "job_states"("user_id", "state");

-- CreateIndex
CREATE UNIQUE INDEX "job_states_user_id_job_id_key" ON "job_states"("user_id", "job_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_boards_provider_slug_key" ON "job_boards"("provider", "slug");

-- AddForeignKey
ALTER TABLE "resume_parsed_data" ADD CONSTRAINT "resume_parsed_data_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tailored_documents" ADD CONSTRAINT "tailored_documents_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tailored_documents" ADD CONSTRAINT "tailored_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_states" ADD CONSTRAINT "job_states_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
