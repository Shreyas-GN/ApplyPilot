CREATE TYPE "public"."job_state" AS ENUM('saved', 'dismissed');--> statement-breakpoint
CREATE TABLE "job_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"state" "job_state" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_states" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "job_states" ADD CONSTRAINT "job_states_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_states" ADD CONSTRAINT "job_states_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "job_states_user_job_idx" ON "job_states" USING btree ("user_id","job_id");--> statement-breakpoint
CREATE INDEX "job_states_user_state_idx" ON "job_states" USING btree ("user_id","state");--> statement-breakpoint
CREATE POLICY "job_states_owner_policy" ON "job_states" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));