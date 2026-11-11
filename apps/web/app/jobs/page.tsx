"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { JobDto } from "@/lib/types";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api-client";

export default function JobsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <JobsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function scoreTone(score: number): string {
  if (score >= 75) return "bg-emerald-100 text-emerald-800";
  if (score >= 50) return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

function JobsContent() {
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [workMode, setWorkMode] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchJobs = useCallback(async (q: string, mode: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (mode !== "all") params.set("workMode", mode);
      const qs = params.toString();
      const data = await api.get<JobDto[]>(`/jobs${qs ? `?${qs}` : ""}`);
      setJobs(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<JobDto[]>("/jobs")
      .then((data) => {
        if (!cancelled) setJobs(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.detail : "Failed to load jobs.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    void fetchJobs(query, workMode);
  }

  async function handleSync() {
    setSyncing(true);
    setError(null);
    setSyncMessage(null);
    try {
      const res = await api.post<{ synced: number; boardsChecked: number }>("/jobs/sync");
      setSyncMessage(`Synced ${res.synced} jobs from ${res.boardsChecked} public ATS boards.`);
      await fetchJobs(query, workMode);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to sync jobs.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleSaveJob(job: JobDto, status: "saved" | "applied") {
    setSavingId(job.id);
    setError(null);
    try {
      const created = await api.post<{ id: string; status: JobDto["applicationStatus"] }>(
        "/applications",
        {
          jobId: job.id,
          company: job.company,
          title: job.title,
          location: job.location,
          url: job.url,
          status,
          matchScore: job.match.score,
        }
      );
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? { ...j, applicationId: created.id, applicationStatus: created.status }
            : j
        )
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to save application.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Job Discovery</h1>
          <p className="mt-1 text-sm text-slate-500">
            Open roles ranked transparently against your profile skills and preferences.
          </p>
        </div>
        <Button onClick={handleSync} loading={syncing} variant="secondary">
          Sync live jobs
        </Button>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {syncMessage && <Alert tone="success">{syncMessage}</Alert>}

      <Card>
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, company, skill, or location..."
            className="min-w-[240px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
          />
          <select
            value={workMode}
            onChange={(e) => {
              const next = e.target.value;
              setWorkMode(next);
              void fetchJobs(query, next);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
          >
            <option value="all">All work modes</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>
          <Button type="submit">Search</Button>
        </form>
      </Card>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-slate-900">No jobs found yet.</p>
            <p className="mt-1 text-sm text-slate-500">
              Click &ldquo;Sync live jobs&rdquo; above to pull open roles from public Greenhouse boards.
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => {
            const expanded = expandedId === job.id;
            return (
              <Card key={job.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-lg font-semibold text-slate-900">{job.title}</h2>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreTone(
                          job.match.score
                        )}`}
                      >
                        {job.match.score}% Match
                      </span>
                      {job.applicationStatus && <StatusBadge status={job.applicationStatus} />}
                    </div>

                    <p className="mt-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-800">{job.company}</span>
                      {job.location ? ` · ${job.location}` : ""}
                      {job.workMode ? ` · ${job.workMode}` : ""}
                    </p>

                    {job.match.reasons.length > 0 && (
                      <ul className="mt-2 flex flex-col gap-0.5 text-xs text-slate-600">
                        {job.match.reasons.map((reason) => (
                          <li key={reason}>• {reason}</li>
                        ))}
                      </ul>
                    )}

                    {(job.match.matchedSkills.length > 0 || job.skills.length > 0) && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {job.match.matchedSkills.map((skill) => (
                          <Badge key={`m-${skill}`} className="bg-emerald-50 text-emerald-700">
                            {`✓ ${skill}`}
                          </Badge>
                        ))}
                        {job.skills
                          .filter(
                            (s) =>
                              !job.match.matchedSkills.some(
                                (m) => m.toLowerCase() === s.toLowerCase()
                              )
                          )
                          .slice(0, 6)
                          .map((skill) => (
                            <Badge key={`s-${skill}`} className="bg-slate-100 text-slate-600">
                              {skill}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View posting ↗
                    </a>
                    {job.applicationId ? (
                      <Link href="/applications">
                        <Button variant="secondary" className="px-3 py-1.5 text-xs">
                          In tracker
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs"
                          loading={savingId === job.id}
                          onClick={() => handleSaveJob(job, "saved")}
                        >
                          Save
                        </Button>
                        <Button
                          className="px-3 py-1.5 text-xs"
                          loading={savingId === job.id}
                          onClick={() => handleSaveJob(job, "applied")}
                        >
                          Mark applied
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-100 pt-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : job.id)}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    {expanded ? "Hide description" : "Read description"}
                  </button>
                  {expanded && (
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                      {job.description.slice(0, 2000)}
                      {job.description.length > 2000 ? "..." : ""}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
