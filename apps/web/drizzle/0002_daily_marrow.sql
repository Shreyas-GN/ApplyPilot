CREATE TABLE "tailored_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid,
	"application_id" uuid,
	"company" text NOT NULL,
	"job_title" text NOT NULL,
	"type" text NOT NULL,
	"tone" text,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tailored_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tailored_documents" ADD CONSTRAINT "tailored_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tailored_documents" ADD CONSTRAINT "tailored_documents_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tailored_documents" ADD CONSTRAINT "tailored_documents_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tailored_documents_user_id_idx" ON "tailored_documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tailored_documents_user_job_idx" ON "tailored_documents" USING btree ("user_id","job_id");--> statement-breakpoint
CREATE POLICY "tailored_documents_owner_policy" ON "tailored_documents" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));