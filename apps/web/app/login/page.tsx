"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { loginSchema } from "@applypilot/validators";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const result = loginSchema.safeParse({ email, password });
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
      await login(result.data.email, result.data.password);
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        if (
          error.status === 401 ||
          /invalid login credentials/i.test(error.detail)
        ) {
          setFormError("Incorrect email or password.");
        } else if (/email not confirmed/i.test(error.detail)) {
          setFormError(
            "Please confirm your email address before logging in. Check your inbox for the verification link."
          );
        } else {
          setFormError(error.detail);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-center text-lg font-semibold text-brand-700">
          ApplyPilot
        </Link>
        <Card>
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mb-6 text-sm text-slate-500">Log in to continue your job search.</p>
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              required
            />
            <div className="text-right text-sm">
              <Link href="/forgot-password" className="text-brand-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" loading={submitting} className="w-full">
              Log in
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-brand-600 hover:underline">
              Sign up
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
