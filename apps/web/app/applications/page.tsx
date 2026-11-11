"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { ApplicationDto, ApplicationStatus } from "@/lib/types";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api-client";

const STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
];

export default function ApplicationsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ApplicationsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function ApplicationsContent() {
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "all">("all");

  // Manual add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("applied");
  const [submitting, setSubmitting] = useState(false);

  // Expanded details / notes
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

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
      });
      setApplications((prev) => [created, ...prev]);
      setCompany("");
      setTitle("");
      setLocation("");
      setUrl("");
      setStatus("applied");
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

  async function handleSaveNotes(appId: string) {
    setSavingId(appId);
    setError(null);
    try {
      const updated = await api.patch<ApplicationDto>(`/applications/${appId}`, {
        notes: editingNotes[appId] ?? "",
      });
      setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to save notes.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(appId: string) {
    setError(null);
    try {
      await api.delete(`/applications/${appId}`);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to delete application.");
    }
  }

  const filtered =
    filterStatus === "all"
      ? applications
      : applications.filter((a) => a.status === filterStatus);

  const counts = STATUSES.reduce(
    (acc, st) => {
      acc[st] = applications.filter((a) => a.status === st).length;
      return acc;
    },
    {} as Record<ApplicationStatus, number>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Application Tracker</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your active applications, interview stages, and notes in one place.
          </p>
        </div>
        <Button onClick={() => setShowAddForm((v) => !v)}>
          {showAddForm ? "Cancel" : "+ Add application"}
        </Button>
      </div>

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
            <div className="flex items-end">
              <Button type="submit" loading={submitting}>
                Save application
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterStatus("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            filterStatus === "all"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
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
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {st} ({counts[st]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-slate-900">
              No applications in this view yet.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Save roles from the Jobs feed or add one manually above.
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((app) => {
            const expanded = expandedId === app.id;
            const currentNotes = editingNotes[app.id] ?? app.notes ?? "";
            return (
              <Card key={app.id}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-semibold text-slate-900">{app.title}</h2>
                      <StatusBadge status={app.status} />
                      {app.matchScore !== null && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {app.matchScore}% match
                        </span>
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
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => {
                        if (!expanded) {
                          setEditingNotes((prev) => ({
                            ...prev,
                            [app.id]: app.notes ?? "",
                          }));
                        }
                        setExpandedId(expanded ? null : app.id);
                      }}
                    >
                      {expanded ? "Close" : "Notes & history"}
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

                {expanded && (
                  <div className="mt-4 grid gap-6 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Notes
                      </label>
                      <textarea
                        rows={4}
                        value={currentNotes}
                        onChange={(e) =>
                          setEditingNotes((prev) => ({
                            ...prev,
                            [app.id]: e.target.value,
                          }))
                        }
                        placeholder="Recruiter name, interview takeaways, salary range..."
                        className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                      />
                      <div className="mt-2">
                        <Button
                          className="px-3 py-1.5 text-xs"
                          loading={savingId === app.id}
                          onClick={() => handleSaveNotes(app.id)}
                        >
                          Save notes
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Activity timeline
                      </p>
                      {app.events && app.events.length > 0 ? (
                        <ul className="flex flex-col gap-2">
                          {app.events.map((ev) => (
                            <li
                              key={ev.id}
                              className="flex items-start justify-between gap-2 text-xs text-slate-600"
                            >
                              <span>• {ev.description}</span>
                              <span className="shrink-0 text-slate-400">
                                {new Date(ev.createdAt).toLocaleDateString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400">No events recorded yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
