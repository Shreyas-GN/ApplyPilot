"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  Compass,
  ExternalLink,
  EyeOff,
  Search,
  Sparkles,
  Undo2,
} from "lucide-react";
import type { JobDto } from "@/lib/types";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api-client";
import { formatExperienceLevel, formatFreshness, scoreTone } from "@/lib/job-ui";

type UiTab = "for-you" | "search" | "adjacent" | "saved";

const UI_TABS: Array<{
  id: UiTab;
  apiTab: "for_you" | "search" | "adjacent" | "saved";
  label: string;
  description: string;
}> = [
  {
    id: "for-you",
    apiTab: "for_you",
    label: "For You",
    description: "Personalized job feed ranked transparently against your verified profile.",
  },
  {
    id: "search",
    apiTab: "search",
    label: "Search Jobs",
    description: "Explore the full job catalog with keyword, work mode, freshness, and level filters.",
  },
  {
    id: "adjacent",
    apiTab: "adjacent",
    label: "Explore Adjacent Roles",
    description:
      "Roles beyond conventional title searches where your core and transferable skills overlap strongly.",
  },
  {
    id: "saved",
    apiTab: "saved",
    label: "Saved Jobs",
    description: "Bookmarked opportunities ready for tailoring and application.",
  },
];

function parseTab(raw: string | null): UiTab {
  if (raw === "search" || raw === "adjacent" || raw === "saved") return raw;
  return "for-you";
}

function buildJobsQuery(params: {
  tab: UiTab;
  q: string;
  workMode: string;
  freshness: string;
  minScore: string;
  seniority: string;
  experienceLevel: string;
  locationCountry: string;
  source: string;
  includeDismissed: boolean;
}): string {
  const apiTab = UI_TABS.find((t) => t.id === params.tab)?.apiTab ?? "for_you";
  const sp = new URLSearchParams();
  sp.set("tab", apiTab);
  if (params.q.trim()) sp.set("q", params.q.trim());
  if (params.workMode !== "all") sp.set("workMode", params.workMode);
  if (params.freshness !== "all") sp.set("freshness", params.freshness);
  if (params.minScore !== "0") sp.set("minScore", params.minScore);
  if (params.seniority !== "all") sp.set("seniority", params.seniority);
  if (params.experienceLevel !== "all") sp.set("experienceLevel", params.experienceLevel);
  if (params.locationCountry !== "all") sp.set("locationCountry", params.locationCountry);
  if (params.source !== "all") sp.set("source", params.source);
  if (params.includeDismissed) sp.set("includeDismissed", "true");
  return `/jobs?${sp.toString()}`;
}

export default function JobsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white" />}>
          <JobsContent />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}

function JobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));

  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastDismissed, setLastDismissed] = useState<{
    id: string;
    title: string;
    company: string;
  } | null>(null);

  const [query, setQuery] = useState("");
  const [workMode, setWorkMode] = useState("all");
  const [freshness, setFreshness] = useState("all");
  const [minScore, setMinScore] = useState("0");
  const [seniority, setSeniority] = useState("all");
  const [experienceLevel, setExperienceLevel] = useState("all");
  const [locationCountry, setLocationCountry] = useState("all");
  const [source, setSource] = useState("all");
  const [includeDismissed, setIncludeDismissed] = useState(false);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);

  const fetchJobs = useCallback(
    async (overrides?: {
      tab?: UiTab;
      q?: string;
      workMode?: string;
      freshness?: string;
      minScore?: string;
      seniority?: string;
      experienceLevel?: string;
      locationCountry?: string;
      source?: string;
      includeDismissed?: boolean;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const url = buildJobsQuery({
          tab: overrides?.tab ?? activeTab,
          q: overrides?.q ?? query,
          workMode: overrides?.workMode ?? workMode,
          freshness: overrides?.freshness ?? freshness,
          minScore: overrides?.minScore ?? minScore,
          seniority: overrides?.seniority ?? seniority,
          experienceLevel: overrides?.experienceLevel ?? experienceLevel,
          locationCountry: overrides?.locationCountry ?? locationCountry,
          source: overrides?.source ?? source,
          includeDismissed: overrides?.includeDismissed ?? includeDismissed,
        });
        const data = await api.get<JobDto[]>(url);
        setJobs(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.detail : "Failed to load jobs.");
      } finally {
        setLoading(false);
      }
    },
    [activeTab, experienceLevel, freshness, includeDismissed, locationCountry, minScore, query, seniority, source, workMode]
  );

  useEffect(() => {
    let cancelled = false;
    const url = buildJobsQuery({
      tab: activeTab,
      q: query,
      workMode,
      freshness,
      minScore,
      seniority,
      experienceLevel,
      locationCountry,
      source,
      includeDismissed,
    });
    api
      .get<JobDto[]>(url)
      .then((data) => {
        if (!cancelled) {
          setJobs(data);
          setError(null);
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function handleTabChange(nextTab: UiTab) {
    setLoading(true);
    setLastDismissed(null);
    router.replace(`/jobs?tab=${nextTab}`);
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    void fetchJobs();
  }

  async function handleSync() {
    setSyncing(true);
    setError(null);
    setSyncMessage(null);
    try {
      const res = await api.post<{ synced: number; boardsChecked: number }>("/jobs/sync");
      setSyncMessage(`Synced ${res.synced} jobs from ${res.boardsChecked} public ATS boards.`);
      await fetchJobs();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to sync jobs.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleToggleSave(job: JobDto) {
    setBusyJobId(job.id);
    setError(null);
    try {
      if (job.userState === "saved") {
        await api.delete(`/jobs/${job.id}/state`);
        setJobs((prev) => {
          const updated = prev.map((j) =>
            j.id === job.id ? { ...j, userState: null } : j
          );
          return activeTab === "saved"
            ? updated.filter((j) => j.userState === "saved" || j.applicationStatus === "saved")
            : updated;
        });
      } else {
        const res = await api.put<{
          userState: "saved";
          applicationId: string | null;
          applicationStatus: JobDto["applicationStatus"];
        }>(`/jobs/${job.id}/state`, { state: "saved" });
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? {
                  ...j,
                  userState: res.userState,
                  applicationId: res.applicationId ?? j.applicationId,
                  applicationStatus: res.applicationStatus ?? j.applicationStatus,
                }
              : j
          )
        );
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to update saved state.");
    } finally {
      setBusyJobId(null);
    }
  }

  async function handleDismiss(job: JobDto) {
    setBusyJobId(job.id);
    setError(null);
    try {
      await api.put(`/jobs/${job.id}/state`, { state: "dismissed" });
      setLastDismissed({ id: job.id, title: job.title, company: job.company });
      if (!includeDismissed) {
        setJobs((prev) => prev.filter((j) => j.id !== job.id));
      } else {
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, userState: "dismissed" } : j))
        );
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to dismiss job.");
    } finally {
      setBusyJobId(null);
    }
  }

  async function handleRestoreDismissed(jobId: string) {
    setBusyJobId(jobId);
    setError(null);
    try {
      await api.delete(`/jobs/${jobId}/state`);
      setLastDismissed(null);
      await fetchJobs();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to restore job.");
    } finally {
      setBusyJobId(null);
    }
  }

  async function handleMarkApplied(job: JobDto) {
    setBusyJobId(job.id);
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
          status: "applied",
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
      setError(err instanceof ApiError ? err.detail : "Failed to track application.");
    } finally {
      setBusyJobId(null);
    }
  }

  const activeMeta = UI_TABS.find((t) => t.id === activeTab) ?? UI_TABS[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Opportunity Intelligence"
        title="Discover Jobs"
        description={activeMeta?.description}
        actions={
          <Button onClick={handleSync} loading={syncing} variant="secondary">
            Sync live jobs
          </Button>
        }
      />

      <Tabs
        ariaLabel="Discover Jobs views"
        value={activeTab}
        onChange={handleTabChange}
        items={UI_TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
      />

      {activeTab === "adjacent" && (
        <div className="flex items-start gap-3 rounded-xl border border-ui-lilac bg-ui-lilac-soft p-4 text-sm text-ui-ink">
          <Compass className="mt-0.5 h-5 w-5 shrink-0 text-ui-violet" />
          <div>
            <p className="font-semibold text-ui-ink">Adjacent-role discovery</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ui-body">
              These roles have titles outside your primary search targets, yet strongly overlap with your verified skills and transferable capabilities.
            </p>
          </div>
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}
      {syncMessage && <Alert tone="success">{syncMessage}</Alert>}

      {lastDismissed && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-ui-border bg-white px-4 py-2.5 text-sm shadow-xs">
          <span className="text-ui-ink">
            Dismissed <strong>{lastDismissed.title}</strong> at {lastDismissed.company}.
          </span>
          <button
            type="button"
            onClick={() => handleRestoreDismissed(lastDismissed.id)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-ui-violet hover:bg-ui-lilac-soft"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <Card>
        <form onSubmit={handleSearch} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ui-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, company, skill, or location..."
                className="w-full rounded-lg border border-ui-border py-2 pr-3 pl-9 text-sm text-ui-ink focus:border-ui-violet focus:outline-none"
              />
            </div>
            <Button type="submit">Apply filters</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <select
              aria-label="Work mode filter"
              value={workMode}
              onChange={(e) => {
                const next = e.target.value;
                setWorkMode(next);
                void fetchJobs({ workMode: next });
              }}
              className="rounded-lg border border-ui-border bg-white px-3 py-1.5 text-xs font-medium text-ui-ink focus:border-ui-violet focus:outline-none"
            >
              <option value="all">All work modes</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>

            <select
              aria-label="Freshness filter"
              value={freshness}
              onChange={(e) => {
                const next = e.target.value;
                setFreshness(next);
                void fetchJobs({ freshness: next });
              }}
              className="rounded-lg border border-ui-border bg-white px-3 py-1.5 text-xs font-medium text-ui-ink focus:border-ui-violet focus:outline-none"
            >
              <option value="all">Any time</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>

            <select
              aria-label="Minimum match score"
              value={minScore}
              onChange={(e) => {
                const next = e.target.value;
                setMinScore(next);
                void fetchJobs({ minScore: next });
              }}
              className="rounded-lg border border-ui-border bg-white px-3 py-1.5 text-xs font-medium text-ui-ink focus:border-ui-violet focus:outline-none"
            >
              <option value="0">Any match score</option>
              <option value="50">50%+ Match</option>
              <option value="70">70%+ Strong Match</option>
              <option value="85">85%+ Top Match</option>
            </select>

            <select
              aria-label="Seniority filter"
              value={seniority}
              onChange={(e) => {
                const next = e.target.value;
                setSeniority(next);
                void fetchJobs({ seniority: next });
              }}
              className="rounded-lg border border-ui-border bg-white px-3 py-1.5 text-xs font-medium text-ui-ink focus:border-ui-violet focus:outline-none"
            >
              <option value="all">All levels</option>
              <option value="junior">Entry / Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="staff">Staff / Lead</option>
            </select>

            <select
              aria-label="Experience level filter"
              value={experienceLevel}
              onChange={(e) => {
                const next = e.target.value;
                setExperienceLevel(next);
                void fetchJobs({ experienceLevel: next });
              }}
              className="rounded-lg border border-ui-border bg-white px-3 py-1.5 text-xs font-medium text-ui-ink focus:border-ui-violet focus:outline-none"
            >
              <option value="all">All experience levels</option>
              <option value="internship">Internship</option>
              <option value="fresher">Fresher / Entry-level</option>
              <option value="0_2">0–2 years</option>
              <option value="2_5">2–5 years</option>
              <option value="5_8">5–8 years</option>
              <option value="8_plus">8+ years</option>
            </select>

            <select
              aria-label="Location country filter"
              value={locationCountry}
              onChange={(e) => {
                const next = e.target.value;
                setLocationCountry(next);
                void fetchJobs({ locationCountry: next });
              }}
              className="rounded-lg border border-ui-border bg-white px-3 py-1.5 text-xs font-medium text-ui-ink focus:border-ui-violet focus:outline-none"
            >
              <option value="all">All locations</option>
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
            </select>

            <select
              aria-label="Job source filter"
              value={source}
              onChange={(e) => {
                const next = e.target.value;
                setSource(next);
                void fetchJobs({ source: next });
              }}
              className="rounded-lg border border-ui-border bg-white px-3 py-1.5 text-xs font-medium text-ui-ink focus:border-ui-violet focus:outline-none"
            >
              <option value="all">All sources</option>
              <option value="greenhouse">Greenhouse</option>
              <option value="lever">Lever</option>
            </select>

            {activeTab !== "saved" && (
              <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-ui-body">
                <input
                  type="checkbox"
                  checked={includeDismissed}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setIncludeDismissed(next);
                    void fetchJobs({ includeDismissed: next });
                  }}
                  className="rounded border-ui-border text-ui-violet focus:ring-brand-500"
                />
                <span>Show dismissed</span>
              </label>
            )}
          </div>
        </form>
      </Card>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-ui-linen" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-ui-ink">
              {activeTab === "saved"
                ? "No saved jobs yet."
                : activeTab === "adjacent"
                  ? "No adjacent roles matched your current skills and filters."
                  : "No jobs found matching your filters."}
            </p>
            <p className="mt-1 text-sm text-ui-muted">
              {activeTab === "saved"
                ? "Save roles from For You or Search Jobs to review and tailor applications later."
                : 'Try adjusting your filters or click "Sync live jobs" above to pull fresh postings.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => {
            const isSaved = job.userState === "saved" || job.applicationStatus === "saved";
            const isDismissed = job.userState === "dismissed";

            return (
              <Card key={job.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-lg font-semibold text-ui-ink hover:text-ui-violet hover:underline"
                      >
                        {job.title}
                      </Link>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreTone(
                          job.match.score
                        )}`}
                      >
                        {job.match.score}% Match
                      </span>
                      {job.match.isAdjacentRole && (
                        <Badge className="bg-ui-lilac-soft text-ui-violet">
                          Adjacent Role
                        </Badge>
                      )}
                      {job.applicationStatus && <StatusBadge status={job.applicationStatus} />}
                      {isDismissed && (
                        <Badge className="bg-ui-linen text-ui-muted">Dismissed</Badge>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-ui-body">
                      <span className="font-medium text-ui-ink">{job.company}</span>
                      {(job.normalizedLocation ?? job.location) ? ` · ${job.normalizedLocation ?? job.location}` : ""}
                      {job.workMode ? ` · ${job.workMode}` : ""}
                      {job.isIndiaRemote ? " · India Remote" : ""}
                      {" · "}
                      <span className="text-ui-muted">
                        {formatFreshness(job.postedAt, job.createdAt)}
                      </span>
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ui-muted">
                      <span>Skills fit: {job.match.skillsScore}%</span>
                      <span>Experience fit: {job.match.experienceScore}%</span>
                      {job.experienceLevel && (
                        <span>Exp: {formatExperienceLevel(job.experienceLevel)}</span>
                      )}
                      {job.salaryText && (
                        <span>{job.salaryCurrency ? `${job.salaryCurrency} ` : ""}{job.salaryText}</span>
                      )}
                    </div>

                    {job.match.adjacencyReason && activeTab === "adjacent" ? (
                      <p className="mt-2 text-xs text-brand-800">{job.match.adjacencyReason}</p>
                    ) : (
                      job.match.reasons.length > 0 && (
                        <ul className="mt-2 flex flex-col gap-0.5 text-xs text-ui-body">
                          {job.match.reasons.slice(0, 2).map((reason) => (
                            <li key={reason}>• {reason}</li>
                          ))}
                        </ul>
                      )
                    )}

                    {(job.match.matchedSkills.length > 0 ||
                      job.match.transferableSkills.length > 0 ||
                      job.skills.length > 0) && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {job.match.matchedSkills.slice(0, 4).map((skill) => (
                          <Badge key={`m-${skill}`} className="bg-emerald-50 text-emerald-700">
                            {`✓ ${skill}`}
                          </Badge>
                        ))}
                        {job.match.transferableSkills.slice(0, 2).map((t) => (
                          <Badge
                            key={`t-${t.targetSkill}`}
                            className="bg-sky-50 text-sky-700"
                          >
                            {`${t.candidateSkill} → ${t.targetSkill}`}
                          </Badge>
                        ))}
                        {job.skills
                          .filter(
                            (s) =>
                              !job.match.matchedSkills.some(
                                (m) => m.toLowerCase() === s.toLowerCase()
                              )
                          )
                          .slice(0, 4)
                          .map((skill) => (
                            <Badge key={`s-${skill}`} className="bg-ui-linen text-ui-body">
                              {skill}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link href={`/jobs/${job.id}`}>
                      <Button variant="secondary" className="px-3 py-1.5 text-xs">
                        <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-ui-violet" />
                        Intelligence
                      </Button>
                    </Link>

                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-ui-border px-2.5 py-1.5 text-xs font-medium text-ui-ink hover:bg-ui-canvas"
                    >
                      <span>Original</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>

                    <Link href={`/studio?tab=tailored&jobId=${job.id}`}>
                      <Button variant="secondary" className="px-3 py-1.5 text-xs">
                        Tailor
                      </Button>
                    </Link>

                    {!isDismissed && (
                      <Button
                        variant={isSaved ? "primary" : "secondary"}
                        className="px-3 py-1.5 text-xs"
                        loading={busyJobId === job.id}
                        onClick={() => handleToggleSave(job)}
                      >
                        <Bookmark className="mr-1 inline h-3.5 w-3.5" />
                        {isSaved ? "Saved" : "Save"}
                      </Button>
                    )}

                    {isDismissed ? (
                      <Button
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                        loading={busyJobId === job.id}
                        onClick={() => handleRestoreDismissed(job.id)}
                      >
                        Restore
                      </Button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDismiss(job)}
                        title="Dismiss job from feed"
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ui-muted hover:bg-ui-linen hover:text-ui-ink"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Dismiss</span>
                      </button>
                    )}

                    {job.applicationId ? (
                      <Link href="/applications">
                        <Button variant="ghost" className="px-2.5 py-1.5 text-xs">
                          In tracker
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        className="px-3 py-1.5 text-xs"
                        loading={busyJobId === job.id}
                        onClick={() => handleMarkApplied(job)}
                      >
                        Mark applied
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
