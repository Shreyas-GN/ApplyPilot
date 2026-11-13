ALTER TYPE "public"."application_status" ADD VALUE 'preparing' AFTER 'saved';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE 'ready_to_apply' AFTER 'preparing';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE 'withdrawn' AFTER 'rejected';
