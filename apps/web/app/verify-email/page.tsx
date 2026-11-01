"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

function VerifyEmailStatus() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"verifying" | "success" | "error">(
    token ? "verifying" : "error",
  );
  const [message, setMessage] = useState(token ? "" : "This verification link is missing its token.");

  useEffect(() => {
    if (!token) return;
    api
      .post("/auth/verify-email", { token })
      .then(() => setState("success"))
      .catch((err) => {
        setState("error");
        setMessage(err instanceof ApiError ? err.detail : "Verification failed.");
      });
  }, [token]);

  if (state === "verifying") return <p className="text-sm text-slate-500">Verifying your email…</p>;
  if (state === "success") {
    return <Alert tone="success">Your email has been verified. Thanks!</Alert>;
  }
  return <Alert tone="error">{message}</Alert>;
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-center text-lg font-semibold text-brand-700">
          ApplyPilot
        </Link>
        <Card>
          <h1 className="mb-6 text-xl font-semibold text-slate-900">Email verification</h1>
          <Suspense fallback={null}>
            <VerifyEmailStatus />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
