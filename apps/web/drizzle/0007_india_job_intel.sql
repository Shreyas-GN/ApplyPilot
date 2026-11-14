ALTER TABLE "jobs" ADD COLUMN "normalized_location" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "location_country" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "is_india_remote" boolean;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_min" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_max" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_currency" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_period" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_text" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "experience_level" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "experience_text" text;--> statement-breakpoint
CREATE INDEX "jobs_experience_level_idx" ON "jobs" USING btree ("experience_level");--> statement-breakpoint
CREATE INDEX "jobs_location_country_idx" ON "jobs" USING btree ("location_country");
