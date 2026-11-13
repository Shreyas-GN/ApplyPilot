ALTER TYPE "public"."application_status" ADD VALUE 'preparing';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE 'ready_to_apply';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE 'withdrawn';--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "tailored_resume_id" uuid;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "cover_letter_id" uuid;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "application_source" text;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_tailored_resume_id_tailored_documents_id_fk" FOREIGN KEY ("tailored_resume_id") REFERENCES "public"."tailored_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_cover_letter_id_tailored_documents_id_fk" FOREIGN KEY ("cover_letter_id") REFERENCES "public"."tailored_documents"("id") ON DELETE set null ON UPDATE no action;
