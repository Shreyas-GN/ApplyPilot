ALTER TABLE "applications" ADD COLUMN "follow_up_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "checklist" jsonb;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "notification_preferences" jsonb;