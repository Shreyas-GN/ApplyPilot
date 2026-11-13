ALTER TYPE "public"."application_status" ADD VALUE IF NOT EXISTS 'preparing';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE IF NOT EXISTS 'ready_to_apply';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE IF NOT EXISTS 'withdrawn';
