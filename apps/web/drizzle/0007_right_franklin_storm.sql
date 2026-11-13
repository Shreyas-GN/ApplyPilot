ALTER TYPE "public"."application_status" ADD VALUE 'phone_screen' BEFORE 'interviewing';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE 'background_check' BEFORE 'offer';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE 'withdrawn';--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "archived_at" timestamp with time zone;