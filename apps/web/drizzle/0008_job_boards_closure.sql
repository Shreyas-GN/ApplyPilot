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
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "miss_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "job_boards_provider_slug_idx" ON "job_boards" USING btree ("provider","slug");--> statement-breakpoint
CREATE INDEX "job_boards_enabled_idx" ON "job_boards" USING btree ("is_enabled");