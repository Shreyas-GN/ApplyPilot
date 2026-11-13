CREATE TABLE "job_boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"slug" text NOT NULL,
	"company_name" text NOT NULL,
	"country" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_sync_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "last_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "missing_sync_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "job_boards_provider_slug_idx" ON "job_boards" USING btree ("provider","slug");--> statement-breakpoint
CREATE INDEX "job_boards_enabled_idx" ON "job_boards" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "jobs_closed_at_idx" ON "jobs" USING btree ("closed_at");--> statement-breakpoint
-- Seed board registry with verified boards only
INSERT INTO "job_boards" ("provider", "slug", "company_name", "country") VALUES
  ('greenhouse', 'vercel',       'Vercel',       'US'),
  ('greenhouse', 'anthropic',    'Anthropic',    'US'),
  ('greenhouse', 'stripe',       'Stripe',       'US'),
  ('greenhouse', 'figma',        'Figma',        'US'),
  ('greenhouse', 'freshworks',   'Freshworks',   'IN'),
  ('greenhouse', 'browserstack', 'BrowserStack', 'IN'),
  ('greenhouse', 'meesho',       'Meesho',       'IN'),
  ('lever',      'razorpay',     'Razorpay',     'IN'),
  ('lever',      'swiggy',       'Swiggy',       'IN'),
  ('lever',      'zomato',       'Zomato',       'IN')
ON CONFLICT ("provider", "slug") DO NOTHING;