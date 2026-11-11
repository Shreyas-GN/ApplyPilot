"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <SettingsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const { user } = useAuth();
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resetState, setResetState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleResendVerification() {
    if (!user) return;
    setResendState("sending");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (error) throw error;
      setResendState("sent");
    } catch {
      setResendState("error");
    }
  }

  async function handleRequestPasswordReset() {
    if (!user) return;
    setResetState("sending");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetState("sent");
    } catch {
      setResetState("error");
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>

      <Card>
        <CardHeader title="Account" />
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Email verified</dt>
            <dd className="font-medium text-slate-900">{user?.emailVerified ? "Yes" : "No"}</dd>
          </div>
        </dl>
        {!user?.emailVerified && (
          <div className="mt-4">
            {resendState === "sent" ? (
              <Alert tone="success">Check your inbox (or the server logs in dev) for a new link.</Alert>
            ) : (
              <Button variant="secondary" onClick={handleResendVerification} loading={resendState === "sending"}>
                Resend verification email
              </Button>
            )}
            {resendState === "error" && (
              <div className="mt-3">
                <Alert tone="error">Something went wrong. Try again in a moment.</Alert>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Password" description="Reset your password via a link sent to your email." />
        {resetState === "sent" ? (
          <Alert tone="success">A password reset link is on its way to {user?.email}.</Alert>
        ) : (
          <Button variant="secondary" onClick={handleRequestPasswordReset} loading={resetState === "sending"}>
            Send password reset link
          </Button>
        )}
        {resetState === "error" && (
          <div className="mt-3">
            <Alert tone="error">Something went wrong. Try again in a moment.</Alert>
          </div>
        )}
      </Card>
    </div>
  );
}
