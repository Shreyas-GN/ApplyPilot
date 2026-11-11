ALTER TABLE "education_entries" ADD COLUMN "graduation_year" integer;--> statement-breakpoint
ALTER TABLE "education_entries" ADD COLUMN "grade" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "career_stage" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "preferred_experience_level" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "desired_roles" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "adjacent_roles" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "excluded_roles" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "intelligence_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "technologies" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "contributions" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "github_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "live_url" text;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "proficiency" text;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "years_of_experience" numeric(4, 1);--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "evidence" text;--> statement-breakpoint
ALTER TABLE "work_experiences" ADD COLUMN "responsibilities" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "work_experiences" ADD COLUMN "achievements" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "work_experiences" ADD COLUMN "technologies" text[] DEFAULT '{}'::text[] NOT NULL;