"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  AuditLogDto,
  NotificationPreferences,
  ProfileDto,
} from "@/lib/types";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { ExtensionPairingCard } from "@/components/copilot/extension-pairing-card";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";

type SettingsTab = "account" | "notifications" | "privacy" | "extension";

const SETTINGS_TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: "account", label: "Account" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy & Data" },
  { id: "extension", label: "Extension Pairing" },
];

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  followUpReminders: true,
  jobMatchAlerts: true,
  weeklyDigest: false,
  productUpdates: false,
};

const NOTIFICATION_ITEMS: Array<{
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}> = [
  {
    key: "followUpReminders",
    label: "Follow-up reminder alerts",
    description:
      "Highlight due or upcoming application follow-up dates in your dashboard and tracker.",
  },
  {
    key: "jobMatchAlerts",
    label: "High-match job alerts",
    description:
      "Surface newly synced roles above 75% match in your For You discovery feed.",
  },
  {
    key: "weeklyDigest",
    label: "Weekly job & pipeline digest",
    description:
      "Receive a weekly summary of new matching roles and active application stages.",
  },
  {
    key: "productUpdates",
    label: "Product & extension updates",
    description:
      "Occasional release notes when new ATS connectors or Copilot improvements launch.",
  },
];

const ACTION_LABELS: Record<string, string> = {
  profile_updated: "Updated profile details",
  resume_uploaded: "Uploaded a resume",
  resume_deleted: "Deleted a resume",
  resume_confirmed: "Confirmed AI-parsed resume into profile",
  tailored_document_created: "Generated tailored resume or cover letter",
  screening_answer_generated: "Drafted screening question answer",
  application_created: "Added tracked application",
  application_updated: "Updated tracked application",
  application_deleted: "Deleted tracked application",
  extension_paired: "Paired a Chrome Extension session",
  extension_revoked: "Revoked a Chrome Extension session",
  extension_activity: "Used Chrome Extension Co-pilot",
  account_data_exported: "Exported account data JSON",
};

function parseSettingsTab(raw: string | null): SettingsTab {
  if (
    raw === "notifications" ||
    raw === "privacy" ||
    raw === "extension"
  ) {
    return raw;
  }
  return "account";
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white" />}>
          <SettingsContent />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseSettingsTab(searchParams.get("tab"));
  const { user, logout } = useAuth();

  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resetState, setResetState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // Profile / notifications
  const { data: profile, refetch: refetchProfile } = useApi<ProfileDto>("/profile");
  const [draftNotifications, setDraftNotifications] =
    useState<NotificationPreferences | null>(null);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notifStatus, setNotifStatus] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

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

  const effectiveNotifications: NotificationPreferences =
    draftNotifications ??
    profile?.notificationPreferences ??
    DEFAULT_NOTIFICATION_PREFS;

  function handleTabChange(nextTab: SettingsTab) {
    router.replace(`/settings?tab=${nextTab}`);
  }

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

  async function handleSaveNotifications(e: FormEvent) {
    e.preventDefault();
    setSavingNotifications(true);
    setNotifStatus(null);
    try {
      await api.patch("/profile/preferences", {
        notificationPreferences: effectiveNotifications,
      });
      refetchProfile();
      refetchActivity();
      setNotifStatus({
        tone: "success",
        text: "Notification preferences saved.",
      });
    } catch (err) {
      setNotifStatus({
        tone: "error",
        text:
          err instanceof ApiError
            ? err.detail
            : "Failed to update notification preferences.",
      });
    } finally {
      setSavingNotifications(false);
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
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader
        eyebrow="Account & Controls"
        title="Settings"
        description="Manage your account, notification preferences, privacy controls, and browser extension pairing."
      />

      <Tabs
        ariaLabel="Settings sections"
        value={activeTab}
        onChange={handleTabChange}
        items={SETTINGS_TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
      />

      {activeTab === "account" && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Account" />
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ui-muted">Email</dt>
                <dd className="font-medium text-ui-ink">{user?.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ui-muted">Email verified</dt>
                <dd className="font-medium text-ui-ink">
                  {user?.emailVerified ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
            {!user?.emailVerified && (
              <div className="mt-4">
                {resendState === "sent" ? (
                  <Alert tone="success">Check your inbox for a confirmation link.</Alert>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={handleResendVerification}
                    loading={resendState === "sending"}
                  >
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
            <CardHeader
              title="Password"
              description="Reset your password via a link sent to your email."
            />
            {resetState === "sent" ? (
              <Alert tone="success">
                A password reset link is on its way to {user?.email}.
              </Alert>
            ) : (
              <Button
                variant="secondary"
                onClick={handleRequestPasswordReset}
                loading={resetState === "sending"}
              >
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
              title="Profile, Resumes & Job Preferences"
              description="Manage your target job titles, work mode, excluded companies, and resume versions."
            />
            <div className="flex flex-wrap gap-3">
              <Link href="/profile">
                <Button variant="secondary">Edit Profile & Preferences</Button>
              </Link>
              <Link href="/studio">
                <Button variant="secondary">Open Resume Studio</Button>
              </Link>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "notifications" && (
        <Card>
          <CardHeader
            title="Notification Preferences"
            description="Choose which reminders and job-matching notifications ApplyPilot surfaces for you."
          />
          {notifStatus && (
            <div className="mb-4">
              <Alert tone={notifStatus.tone}>{notifStatus.text}</Alert>
            </div>
          )}
          <form onSubmit={handleSaveNotifications} className="flex flex-col gap-4">
            {NOTIFICATION_ITEMS.map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-ui-border p-4 hover:bg-ui-canvas/70"
              >
                <div>
                  <p className="text-sm font-medium text-ui-ink">{item.label}</p>
                  <p className="mt-0.5 text-xs text-ui-muted">{item.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={effectiveNotifications[item.key]}
                  onChange={(e) =>
                    setDraftNotifications({
                      ...effectiveNotifications,
                      [item.key]: e.target.checked,
                    })
                  }
                  className="mt-1 h-4 w-4 rounded border-ui-border text-ui-violet focus:ring-brand-500"
                />
              </label>
            ))}
            <div>
              <Button type="submit" loading={savingNotifications}>
                Save notification preferences
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === "privacy" && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Activity & Automation Log"
              description="Recent security, tailoring, and Co-pilot actions on your account."
            />
            {activityLoading ? (
              <div className="h-20 animate-pulse rounded bg-ui-linen" />
            ) : activity && activity.length > 0 ? (
              <ul className="flex max-h-64 flex-col divide-y divide-slate-100 overflow-y-auto text-xs">
                {activity.slice(0, 20).map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-4 py-2">
                    <span className="text-ui-ink">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </span>
                    <span className="shrink-0 text-ui-muted">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ui-muted">No recorded activity yet.</p>
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
                  className="inline-flex items-center justify-center rounded-lg border border-ui-border bg-white px-4 py-2 text-sm font-medium text-ui-ink hover:bg-ui-canvas"
                >
                  Export all my data (JSON)
                </a>
              </div>

              <form onSubmit={handleDeleteAccount} className="border-t border-slate-100 pt-4">
                <p className="mb-2 text-sm font-semibold text-red-700">Danger zone</p>
                <p className="mb-3 text-xs text-ui-muted">
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
      )}

      {activeTab === "extension" && (
        <div className="flex flex-col gap-4">
          <ExtensionPairingCard onSessionChanged={refetchActivity} />
          <div className="flex justify-end">
            <Link
              href="/copilot"
              className="text-xs font-medium text-ui-violet hover:underline"
            >
              Open full Browser Copilot hub →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
