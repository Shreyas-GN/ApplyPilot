"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { registerSchema } from "@applypilot/validators";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export default function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const result = registerSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[String(issue.path[0])] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await register(result.data.email, result.data.password);
      if (res && res.requiresEmailConfirmation) {
        setPendingConfirmation(true);
        return;
      }
      router.push("/onboarding");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.detail : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    if (!email.trim()) return;
    setResending(true);
    setResendMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/onboarding`,
        },
      });
      if (error) throw error;
      setResendMessage("Confirmation link resent. Check your inbox and spam folder.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not resend confirmation email.");
    } finally {
      setResending(false);
    }
  }

  if (pendingConfirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-6 block text-center text-lg font-semibold text-brand-700">
            ApplyPilot
          </Link>
          <Card>
            <h1 className="mb-1 text-xl font-semibold text-slate-900">Check your email</h1>
            <p className="mb-4 text-sm text-slate-600">
              We sent a confirmation link to <strong className="text-slate-900">{email}</strong>.
              Open the link to activate your account and continue onboarding.
            </p>
            {formError && (
              <div className="mb-4">
                <Alert tone="error">{formError}</Alert>
              </div>
            )}
            {resendMessage && (
              <div className="mb-4">
                <Alert tone="success">{resendMessage}</Alert>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="secondary"
                loading={resending}
                onClick={handleResendConfirmation}
              >
                Resend confirmation email
              </Button>
              <Link
                href="/login"
                className="text-center text-sm font-medium text-brand-600 hover:underline"
              >
                Already confirmed? Log in →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-center text-lg font-semibold text-brand-700">
          ApplyPilot
        </Link>
        <Card>
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Create your account</h1>
          <p className="mb-6 text-sm text-slate-500">Find better jobs. Apply smarter.</p>
          {formError && (
            <div className="mb-4">
              <Alert tone="error">{formError}</Alert>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              required
            />
            <TextField
              label="Password"
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              hint="At least 10 characters."
              required
            />
            <Button type="submit" loading={submitting} className="mt-2 w-full">
              Create account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:underline">
              Log in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
