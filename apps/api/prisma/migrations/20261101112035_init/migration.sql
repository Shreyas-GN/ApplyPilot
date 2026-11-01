-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "auth_provider" TEXT NOT NULL DEFAULT 'password',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "user_id" UUID NOT NULL,
    "full_name" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "links" JSONB,
    "parsed_experience" JSONB,
    "parsed_education" JSONB,
    "parsed_skills" JSONB,
    "preferences" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "version_label" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "parsed_json" JSONB,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "source_application_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cover_letter_templates" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tone" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "cover_letter_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "ats_type" TEXT,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "description_raw" TEXT,
    "apply_url" TEXT,
    "posted_at" TIMESTAMP(3),
    "ingested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_json" JSONB,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_embeddings" (
    "job_id" UUID NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "model_version" TEXT NOT NULL,

    CONSTRAINT "job_embeddings_pkey" PRIMARY KEY ("job_id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "rationale" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "mode" TEXT NOT NULL,
    "ats_tier" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "tailored_resume_id" UUID,
    "tailored_cover_letter" TEXT,
    "confidence_score" DECIMAL(65,30),
    "submitted_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_events" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "actor" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ats_connectors" (
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "config" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ats_connectors_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "extension_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_label" TEXT,
    "token_hash" TEXT NOT NULL,
    "scopes" TEXT[],
    "last_seen_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "extension_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "user_id" UUID NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "billing_provider_customer_id" TEXT,
    "current_period_end" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "consent_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "consent_type" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "consent_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "resumes_source_application_id_key" ON "resumes"("source_application_id");

-- CreateIndex
CREATE INDEX "resumes_user_id_idx" ON "resumes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_source_external_id_key" ON "jobs"("source", "external_id");

-- CreateIndex
CREATE INDEX "matches_user_id_status_score_idx" ON "matches"("user_id", "status", "score");

-- CreateIndex
CREATE UNIQUE INDEX "matches_user_id_job_id_key" ON "matches"("user_id", "job_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_tailored_resume_id_key" ON "applications"("tailored_resume_id");

-- CreateIndex
CREATE INDEX "applications_user_id_status_idx" ON "applications"("user_id", "status");

-- CreateIndex
CREATE INDEX "application_events_application_id_created_at_idx" ON "application_events"("application_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_source_application_id_fkey" FOREIGN KEY ("source_application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cover_letter_templates" ADD CONSTRAINT "cover_letter_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_embeddings" ADD CONSTRAINT "job_embeddings_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_tailored_resume_id_fkey" FOREIGN KEY ("tailored_resume_id") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_sessions" ADD CONSTRAINT "extension_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_logs" ADD CONSTRAINT "consent_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
