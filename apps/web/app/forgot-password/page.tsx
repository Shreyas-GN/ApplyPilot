"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { forgotPasswordSchema } from "@applyfocus/validators";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter a valid email.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(result.data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setSent(true);
    } catch {
      // Same response either way — no account-existence signal leaks here.
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ui-canvas px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-center text-lg font-semibold text-ui-violet">
          ApplyFocus
        </Link>
        <Card>
          <h1 className="mb-1 text-xl font-semibold text-ui-ink">Reset your password</h1>
          <p className="mb-6 text-sm text-ui-muted">
            Enter your email and we&apos;ll send you a reset link.
          </p>
          {sent ? (
            <Alert tone="success">
              If an account exists for that email, a reset link is on its way.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && <Alert tone="error">{error}</Alert>}
              <TextField
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" loading={submitting} className="w-full">
                Send reset link
              </Button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-ui-muted">
            <Link href="/login" className="font-medium text-ui-violet hover:underline">
              Back to log in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
