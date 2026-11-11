"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { AuditLogDto, ExtensionSessionDto } from "@/lib/types";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <SettingsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

const ACTION_LABELS: Record<string, string> = {
  profile_updated: "Updated profile details",
  resume_uploaded: "Uploaded a resume",
  resume_deleted: "Deleted a resume",
  resume_confirmed: "Confirmed AI-parsed resume into profile",
  tailored_document_created: "Generated tailored resume or cover letter",
  application_created: "Added tracked application",
  application_updated: "Updated tracked application",
  application_deleted: "Deleted tracked application",
  extension_paired: "Paired a Chrome Extension session",
  extension_revoked: "Revoked a Chrome Extension session",
  extension_activity: "Used Chrome Extension Co-pilot",
  account_data_exported: "Exported account data JSON",
};

function SettingsContent() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resetState, setResetState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // Extension pairing
  const {
    data: sessions,
    loading: sessionsLoading,
    refetch: refetchSessions,
  } = useApi<ExtensionSessionDto[]>("/extension/sessions");
  const [deviceLabel, setDeviceLabel] = useState("My Chrome Browser");
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [pairingBusy, setPairingBusy] = useState(false);
  const [extensionError, setExtensionError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Activity log
  const {
    data: activity,
    loading: activityLoading,
    refetch: refetchActivity,
  } = useApi<AuditLogDto[]>("/account/activity");

  // Data export & delete account
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handleGeneratePairingToken(e: FormEvent) {
    e.preventDefault();
    setPairingBusy(true);
    setExtensionError(null);
    setCopiedToken(false);
    try {
      const res = await api.post<{ session: ExtensionSessionDto; token: string }>(
        "/extension/sessions",
        { label: deviceLabel.trim() || "Chrome Extension" }
      );
      setPairingToken(res.token);
      refetchSessions();
      refetchActivity();
    } catch (err) {
      setExtensionError(
        err instanceof ApiError ? err.detail : "Failed to generate pairing token."
      );
    } finally {
      setPairingBusy(false);
    }
  }

  async function handleRevokeSession(sessionId: string) {
    setExtensionError(null);
    try {
      await api.delete(`/extension/sessions/${sessionId}`);
      refetchSessions();
      refetchActivity();
    } catch (err) {
      setExtensionError(
        err instanceof ApiError ? err.detail : "Failed to revoke session."
      );
    }
  }

  async function handleDeleteAccount(e: FormEvent) {
    e.preventDefault();
    if (deleteConfirm !== "DELETE") {
      setDeleteError('Type "DELETE" to confirm account deletion.');
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirmation: deleteConfirm }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail ?? "Failed to delete account.");
      }
      await logout();
      router.replace("/");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Settings & Privacy</h1>

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
              <Alert tone="success">Check your inbox for a confirmation link.</Alert>
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

      <Card>
        <CardHeader
          title="Chrome Extension Co-Pilot"
          description="Pair your browser extension to capture jobs and review-before-autofill on Greenhouse & Lever applications."
        />
        {extensionError && (
          <div className="mb-3">
            <Alert tone="error">{extensionError}</Alert>
          </div>
        )}

        <form onSubmit={handleGeneratePairingToken} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <TextField
              label="Device label"
              value={deviceLabel}
              onChange={(e) => setDeviceLabel(e.target.value)}
              placeholder="Work Laptop Chrome"
            />
          </div>
          <Button type="submit" loading={pairingBusy}>
            Generate pairing token
          </Button>
        </form>

        {pairingToken && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <p className="font-medium text-emerald-900">
              Copy this pairing token now — it won&apos;t be shown again:
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900">
                {pairingToken}
              </code>
              <Button
                type="button"
                variant="secondary"
                className="px-3 py-1.5 text-xs"
                onClick={() => {
                  void navigator.clipboard.writeText(pairingToken);
                  setCopiedToken(true);
                }}
              >
                {copiedToken ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-emerald-800">
              Load <code>apps/extension/dist</code> as an unpacked extension in Chrome, then paste this token in the ApplyPilot popup.
            </p>
          </div>
        )}

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Extension sessions
          </p>
          {sessionsLoading ? (
            <div className="h-12 animate-pulse rounded bg-slate-100" />
          ) : sessions && sessions.length > 0 ? (
            <ul className="flex flex-col divide-y divide-slate-100 text-sm">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="font-medium text-slate-900">{s.label}</p>
                    <p className="text-xs text-slate-500">
                      Created {new Date(s.createdAt).toLocaleDateString()}
                      {s.lastUsedAt
                        ? ` · Last used ${new Date(s.lastUsedAt).toLocaleString()}`
                        : " · Not used yet"}
                    </p>
                  </div>
                  {s.revokedAt ? (
                    <Badge className="bg-slate-100 text-slate-500">Revoked</Badge>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(s.id)}
                      className="rounded px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Revoke
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No paired extension sessions yet.</p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Activity & Automation Log"
          description="Recent security and Co-pilot actions on your account."
        />
        {activityLoading ? (
          <div className="h-20 animate-pulse rounded bg-slate-100" />
        ) : activity && activity.length > 0 ? (
          <ul className="flex max-h-64 flex-col divide-y divide-slate-100 overflow-y-auto text-xs">
            {activity.slice(0, 20).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 py-2">
                <span className="text-slate-700">
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </span>
                <span className="shrink-0 text-slate-400">
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No recorded activity yet.</p>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Data Export & Account Deletion"
          description="Download all of your data or permanently delete your ApplyPilot account."
        />
        <div className="flex flex-col gap-6">
          <div>
            <a
              href="/api/account/export"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Export all my data (JSON)
            </a>
          </div>

          <form onSubmit={handleDeleteAccount} className="border-t border-slate-100 pt-4">
            <p className="mb-2 text-sm font-semibold text-red-700">Danger zone</p>
            <p className="mb-3 text-xs text-slate-500">
              Permanently deletes your profile, stored resume files, tailored documents, tracked applications, and login account.
            </p>
            {deleteError && (
              <div className="mb-3">
                <Alert tone="error">{deleteError}</Alert>
              </div>
            )}
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1">
                <TextField
                  label='Type "DELETE" to confirm'
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                />
              </div>
              <Button
                type="submit"
                variant="danger"
                loading={deleting}
                disabled={deleteConfirm !== "DELETE"}
              >
                Delete my account
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
