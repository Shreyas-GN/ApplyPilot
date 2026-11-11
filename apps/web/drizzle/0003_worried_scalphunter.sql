CREATE TABLE "extension_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"label" text DEFAULT 'Chrome Extension' NOT NULL,
	"token_hash" text NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "extension_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "extension_sessions" ADD CONSTRAINT "extension_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "extension_sessions_user_id_idx" ON "extension_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "extension_sessions_token_hash_idx" ON "extension_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE POLICY "extension_sessions_owner_policy" ON "extension_sessions" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));