"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, Columns3, LayoutList } from "lucide-react";
import type { ApplicationDto, ApplicationStatus } from "@/lib/types";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { ApplicationDetailPanel } from "@/components/applications/application-detail-panel";
import { api, ApiError } from "@/lib/api-client";

const STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
];

function isFollowUpDueSoon(iso: string | null): boolean {
  if (!iso) return false;
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return false;
  // Due today, overdue, or within the next 3 days
  return ms <= Date.now() + 3 * 24 * 60 * 60 * 1000;
}

export default function ApplicationsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white" />}>
          <ApplicationsContent />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}

function ApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewMode = searchParams.get("view") === "kanban" ? "kanban" : "list";

  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    ApplicationStatus | "all" | "followups"
  >("all");

  // Manual add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("applied");
  const [followUpDate, setFollowUpDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<ApplicationDto[]>("/applications")
      .then((data) => {
        if (!cancelled) setApplications(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.detail : "Failed to load applications.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function setViewMode(nextView: "list" | "kanban") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    router.replace(`/applications?${params.toString()}`);
  }

  async function handleAddApplication(e: FormEvent) {
    e.preventDefault();
    if (!company.trim() || !title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.post<ApplicationDto>("/applications", {
        company: company.trim(),
        title: title.trim(),
        location: location.trim() || null,
        url: url.trim() || null,
        status,
        followUpAt: followUpDate ? new Date(`${followUpDate}T09:00:00Z`).toISOString() : null,
      });
      setApplications((prev) => [created, ...prev]);
      setCompany("");
      setTitle("");
      setLocation("");
      setUrl("");
      setStatus("applied");
      setFollowUpDate("");
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to add application.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(appId: string, nextStatus: ApplicationStatus) {
    setSavingId(appId);
    setError(null);
    try {
      const updated = await api.patch<ApplicationDto>(`/applications/${appId}`, {
        status: nextStatus,
      });
      setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to update status.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(appId: string) {
    setError(null);
    try {
      await api.delete(`/applications/${appId}`);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      if (selectedAppId === appId) setSelectedAppId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to delete application.");
    }
  }

  const dueFollowUpsCount = applications.filter((a) =>
    isFollowUpDueSoon(a.followUpAt)
  ).length;

  const filtered =
    filterStatus === "all"
      ? applications
      : filterStatus === "followups"
        ? applications.filter((a) => Boolean(a.followUpAt))
        : applications.filter((a) => a.status === filterStatus);

  const counts = STATUSES.reduce(
    (acc, st) => {
      acc[st] = applications.filter((a) => a.status === st).length;
      return acc;
    },
    {} as Record<ApplicationStatus, number>
  );

  const selectedApp =
    applications.find((a) => a.id === selectedAppId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Applications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track application stages in List or Kanban view, verify readiness, draft screening answers, and manage follow-up reminders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                viewMode === "list"
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                viewMode === "kanban"
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Columns3 className="h-3.5 w-3.5" />
              <span>Kanban Board</span>
            </button>
          </div>
          <Button onClick={() => setShowAddForm((v) => !v)}>
            {showAddForm ? "Cancel" : "+ Add application"}
          </Button>
        </div>
      </div>

      {dueFollowUpsCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-amber-700" />
            <span>
              You have <strong>{dueFollowUpsCount}</strong> follow-up reminder
              {dueFollowUpsCount === 1 ? "" : "s"} due soon or overdue.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setViewMode("list");
              setFilterStatus("followups");
            }}
            className="text-xs font-semibold text-amber-900 underline"
          >
            View follow-ups
          </button>
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      {showAddForm && (
        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Track a new role
          </h2>
          <form onSubmit={handleAddApplication} className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corp"
              required
            />
            <TextField
              label="Job title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Senior Frontend Engineer"
              required
            />
            <TextField
              label="Location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Remote / Bengaluru"
            />
            <TextField
              label="Job URL (optional)"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Initial status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st} className="capitalize">
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Follow-up reminder (optional)
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" loading={submitting}>
                Save application
              </Button>
            </div>
          </form>
        </Card>
      )}

      {viewMode === "list" && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filterStatus === "all"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            All ({applications.length})
          </button>
          {STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filterStatus === st
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {st} ({counts[st]})
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFilterStatus("followups")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filterStatus === "followups"
                ? "bg-amber-700 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            With reminders ({applications.filter((a) => Boolean(a.followUpAt)).length})
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-slate-900">
              No tracked applications yet.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Save roles from Discover Jobs or click &ldquo;+ Add application&rdquo; above.
            </p>
          </div>
        </Card>
      ) : viewMode === "kanban" ? (
        <div className="grid gap-4 overflow-x-auto pb-2 md:grid-cols-5">
          {STATUSES.map((colStatus) => {
            const colApps = applications.filter((a) => a.status === colStatus);
            return (
              <div
                key={colStatus}
                className="flex min-w-[220px] flex-col gap-3 rounded-xl border border-slate-200 bg-slate-100/70 p-3"
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    {colStatus}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {colApps.length}
                  </span>
                </div>

                {colApps.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400">
                    No {colStatus} roles
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {colApps.map((app) => {
                      const dueSoon = isFollowUpDueSoon(app.followUpAt);
                      return (
                        <div
                          key={app.id}
                          className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-xs"
                        >
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedAppId(app.id)}
                              className="text-left text-sm font-semibold text-slate-900 hover:text-brand-700 hover:underline"
                            >
                              {app.title}
                            </button>
                            <p className="text-xs text-slate-600">{app.company}</p>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {app.matchScore !== null && (
                              <Badge className="bg-slate-100 text-slate-700">
                                {`${app.matchScore}%`}
                              </Badge>
                            )}
                            {app.readiness && (
                              <Badge
                                className={
                                  app.readiness.completedCount ===
                                  app.readiness.totalCount
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-brand-50 text-brand-700"
                                }
                              >
                                {`${app.readiness.completedCount}/${app.readiness.totalCount} ready`}
                              </Badge>
                            )}
                            {app.followUpAt && (
                              <Badge
                                className={
                                  dueSoon
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-600"
                                }
                              >
                                {`Follow-up ${new Date(app.followUpAt).toLocaleDateString()}`}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                            <select
                              aria-label={`Move ${app.title} stage`}
                              value={app.status}
                              disabled={savingId === app.id}
                              onChange={(e) =>
                                handleStatusChange(
                                  app.id,
                                  e.target.value as ApplicationStatus
                                )
                              }
                              className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 focus:border-brand-500 focus:outline-none"
                            >
                              {STATUSES.map((st) => (
                                <option key={st} value={st}>
                                  {st.charAt(0).toUpperCase() + st.slice(1)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setSelectedAppId(app.id)}
                              className="text-xs font-medium text-brand-700 hover:underline"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-slate-900">
              No applications match this filter.
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((app) => {
            const dueSoon = isFollowUpDueSoon(app.followUpAt);
            return (
              <Card key={app.id}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedAppId(app.id)}
                        className="text-left font-semibold text-slate-900 hover:text-brand-700 hover:underline"
                      >
                        {app.title}
                      </button>
                      <StatusBadge status={app.status} />
                      {app.matchScore !== null && (
                        <Badge className="bg-slate-100 text-slate-700">
                          {`${app.matchScore}% match`}
                        </Badge>
                      )}
                      {app.readiness && (
                        <Badge
                          className={
                            app.readiness.completedCount ===
                            app.readiness.totalCount
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-brand-50 text-brand-700"
                          }
                        >
                          {`${app.readiness.completedCount}/${app.readiness.totalCount} ready`}
                        </Badge>
                      )}
                      {app.followUpAt && (
                        <Badge
                          className={
                            dueSoon
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }
                        >
                          {`Follow up ${new Date(app.followUpAt).toLocaleDateString()}`}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-800">{app.company}</span>
                      {app.location ? ` · ${app.location}` : ""}
                      {app.appliedAt
                        ? ` · Applied ${new Date(app.appliedAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Application status"
                      value={app.status}
                      disabled={savingId === app.id}
                      onChange={(e) =>
                        handleStatusChange(app.id, e.target.value as ApplicationStatus)
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-brand-500 focus:outline-none"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st.charAt(0).toUpperCase() + st.slice(1)}
                        </option>
                      ))}
                    </select>
                    {app.url && (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Posting ↗
                      </a>
                    )}
                    <Link href={`/studio?tab=tailored&applicationId=${app.id}`}>
                      <Button variant="secondary" className="px-3 py-1.5 text-xs">
                        Tailor
                      </Button>
                    </Link>
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => setSelectedAppId(app.id)}
                    >
                      Details
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDelete(app.id)}
                      className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selectedApp && (
        <ApplicationDetailPanel
          key={selectedApp.id}
          application={selectedApp}
          onClose={() => setSelectedAppId(null)}
          onUpdated={(next) =>
            setApplications((prev) =>
              prev.map((a) => (a.id === next.id ? next : a))
            )
          }
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
