"use client";

import Link from "next/link";
import { Bot, CheckCircle2, Puzzle, ShieldCheck, Sparkles } from "lucide-react";
import type { ApplicationDto, AuditLogDto } from "@/lib/types";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExtensionPairingCard } from "@/components/copilot/extension-pairing-card";
import { useApi } from "@/lib/use-api";

const COPILOT_ACTION_LABELS: Record<string, string> = {
  extension_paired: "Paired a Chrome Extension session",
  extension_revoked: "Revoked a Chrome Extension session",
  extension_activity: "Autofill / capture action in Chrome Extension",
};

const SUPPORTED_ATS = [
  {
    name: "Greenhouse",
    status: "Supported",
    notes: "Detects application form fields, maps verified profile answers, and prepares review.",
  },
  {
    name: "Lever",
    status: "Supported",
    notes: "Fills candidate contact info, links, work history, and tailored cover letter drafts.",
  },
  {
    name: "Ashby & Workday",
    status: "Beta",
    notes: "Detects standard contact/work fields with manual review before submission.",
  },
];

export default function CopilotPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <CopilotContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function CopilotContent() {
  const {
    data: activity,
    loading: activityLoading,
    refetch: refetchActivity,
  } = useApi<AuditLogDto[]>("/account/activity");
  const { data: applications, loading: appsLoading } =
    useApi<ApplicationDto[]>("/applications");

  const copilotLogs =
    activity?.filter((entry) => entry.action.startsWith("extension_")) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Browser Copilot</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pair the Chrome Extension to detect ATS job pages, autofill application forms from your verified profile, and always review before submission.
          </p>
        </div>
        <Link
          href="/applications"
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View Applications
        </Link>
      </div>

      {/* Setup guide */}
      <Card>
        <CardHeader
          title="Extension Setup"
          description="Connect Chrome to your ApplyPilot workspace in three quick steps."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Puzzle className="h-4 w-4 text-brand-600" />
              <span>1. Load Chrome Extension</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              Open <code>chrome://extensions</code>, enable <strong>Developer mode</strong>, click <strong>Load unpacked</strong>, and select <code>apps/extension/dist</code>.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Bot className="h-4 w-4 text-brand-600" />
              <span>2. Pair Your Browser</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              Generate a pairing token below and paste it into the ApplyPilot extension popup along with this app URL.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              <span>3. Autofill & Review</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              Visit any supported job page to extract job details, autofill your profile fields, and manually review every answer before submitting.
            </p>
          </div>
        </div>
      </Card>

      {/* Inline pairing & session manager */}
      <ExtensionPairingCard
        title="Extension Pairing"
        description="Issue a scoped device token for Chrome or revoke an existing browser session."
        onSessionChanged={refetchActivity}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ATS detection & safeguards */}
        <Card>
          <CardHeader
            title="ATS Detection & Autofill Safeguards"
            description="Built-in guardrails ensure the copilot never submits applications without your review."
          />
          <ul className="flex flex-col gap-3">
            {SUPPORTED_ATS.map((ats) => (
              <li
                key={ats.name}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{ats.name}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{ats.notes}</p>
                </div>
                <Badge
                  className={
                    ats.status === "Supported"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-brand-50 text-brand-700"
                  }
                >
                  {ats.status}
                </Badge>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-brand-50/60 p-3 text-xs text-slate-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <p>
              <strong>Review-before-submit guarantee:</strong> ApplyPilot populates detected form inputs and suggests answers grounded in your profile, but never clicks final submission buttons automatically.
            </p>
          </div>
        </Card>

        {/* Activity history */}
        <Card>
          <CardHeader
            title="Activity History"
            description="Recent extension pairings, autofill events, and captured applications."
          />
          {activityLoading ? (
            <div className="h-28 animate-pulse rounded bg-slate-100" />
          ) : copilotLogs.length > 0 ? (
            <ul className="flex max-h-64 flex-col divide-y divide-slate-100 overflow-y-auto text-xs">
              {copilotLogs.slice(0, 20).map((entry) => {
                const host =
                  entry.metadata && typeof entry.metadata.host === "string"
                    ? entry.metadata.host
                    : null;
                return (
                  <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">
                        {COPILOT_ACTION_LABELS[entry.action] ?? entry.action}
                      </p>
                      {host && <p className="truncate text-slate-500">{host}</p>}
                    </div>
                    <span className="shrink-0 text-slate-400">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
              No extension activity recorded yet. Generate a pairing token above to get started.
            </div>
          )}

          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                <span>Recent tracked roles</span>
              </p>
              <Link href="/applications" className="text-xs font-medium text-brand-700 hover:underline">
                Open tracker
              </Link>
            </div>
            {appsLoading ? (
              <div className="h-12 animate-pulse rounded bg-slate-100" />
            ) : applications && applications.length > 0 ? (
              <ul className="flex flex-col divide-y divide-slate-100 text-xs">
                {applications.slice(0, 5).map((app) => (
                  <li key={app.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0 truncate font-medium text-slate-800">
                      {app.company} — {app.title}
                    </span>
                    <Badge className="bg-slate-100 text-slate-700">{app.status}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">No tracked applications yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
