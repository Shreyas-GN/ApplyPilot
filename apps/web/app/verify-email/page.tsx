"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { AuthError, EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash") ?? "";
  const type = (searchParams.get("type") as EmailOtpType | null) ?? "signup";
  const [state, setState] = useState<"verifying" | "success" | "error">(
    tokenHash ? "verifying" : "error",
  );
  const [message, setMessage] = useState(
    tokenHash ? "" : "This verification link is missing its token. Check your inbox for your confirmation email.",
  );

  useEffect(() => {
    if (!tokenHash) return;
    let cancelled = false;
    const supabase = createClient();
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type })
      .then(({ error }: { data: unknown; error: AuthError | null }) => {
        if (cancelled) return;
        if (error) {
          setState("error");
          setMessage(error.message);
        } else {
          setState("success");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tokenHash, type]);

  if (state === "verifying") return <p className="text-sm text-ui-muted">Verifying your email…</p>;
  if (state === "success") {
    return (
      <div className="flex flex-col gap-3">
        <Alert tone="success">Your email has been verified. Thanks!</Alert>
        <Link href="/dashboard" className="text-sm font-medium text-ui-violet hover:underline">
          Continue to dashboard →
        </Link>
      </div>
    );
  }
  return <Alert tone="error">{message}</Alert>;
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ui-canvas px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-center text-lg font-semibold text-ui-violet">
          ApplyPilot
        </Link>
        <Card>
          <h1 className="mb-6 text-xl font-semibold text-ui-ink">Email verification</h1>
          <Suspense fallback={null}>
            <VerifyEmailStatus />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
