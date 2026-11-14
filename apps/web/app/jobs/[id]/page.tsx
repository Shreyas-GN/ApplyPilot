"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Briefcase,
  CheckCircle2,
  Compass,
  ExternalLink,
  EyeOff,
  FileText,
  Sparkles,
} from "lucide-react";
import type { JobDetailDto } from "@/lib/types";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api-client";
import { barTone, formatExperienceLevel, formatFreshness, scoreTone } from "@/lib/job-ui";

export default function JobDetailPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <JobDetailContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function JobDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = params.id;

  const [job, setJob] = useState<JobDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showRawDescription, setShowRawDescription] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<JobDetailDto>(`/jobs/${jobId}`)
      .then((data) => {
        if (!cancelled) {
          setJob(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.detail : "Failed to load job details.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  async function handleToggleSave() {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      if (job.userState === "saved") {
        await api.delete(`/jobs/${job.id}/state`);
        setJob({ ...job, userState: null });
      } else {
        const res = await api.put<{
          userState: "saved";
          applicationId: string | null;
          applicationStatus: JobDetailDto["applicationStatus"];
        }>(`/jobs/${job.id}/state`, { state: "saved" });
        setJob({
          ...job,
          userState: res.userState,
          applicationId: res.applicationId ?? job.applicationId,
          applicationStatus: res.applicationStatus ?? job.applicationStatus,
        });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to update saved state.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDismiss() {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      if (job.userState === "dismissed") {
        await api.delete(`/jobs/${job.id}/state`);
        setJob({ ...job, userState: null });
      } else {
        await api.put(`/jobs/${job.id}/state`, { state: "dismissed" });
        router.push("/jobs");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to dismiss job.");
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkApplied() {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api.post<{ id: string; status: JobDetailDto["applicationStatus"] }>(
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
      setJob({
        ...job,
        applicationId: created.id,
        applicationStatus: created.status,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to track application.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-44 animate-pulse rounded-xl bg-ui-linen" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="h-72 animate-pulse rounded-xl bg-ui-linen lg:col-span-5" />
          <div className="h-72 animate-pulse rounded-xl bg-ui-linen lg:col-span-7" />
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ui-violet hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Discover Jobs</span>
        </Link>
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }

  if (!job) return null;

  const isSaved = job.userState === "saved" || job.applicationStatus === "saved";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ui-body hover:text-ui-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Discover Jobs</span>
        </Link>
        {job.tailoredDocumentsCount > 0 && (
          <Link
            href={`/studio?tab=tailored&jobId=${job.id}`}
            className="text-xs font-medium text-ui-violet hover:underline"
          >
            {job.tailoredDocumentsCount} tailored draft
            {job.tailoredDocumentsCount === 1 ? "" : "s"} created →
          </Link>
        )}
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* Job Header Card */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold text-ui-ink">{job.title}</h1>
              <span
                className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${scoreTone(
                  job.match.score
                )}`}
              >
                {job.match.score}% Overall Match
              </span>
              {job.match.isAdjacentRole && (
                <Badge className="bg-ui-lilac-soft text-ui-violet">Adjacent Role</Badge>
              )}
              {job.applicationStatus && <StatusBadge status={job.applicationStatus} />}
            </div>

            <p className="mt-2 text-sm text-ui-body">
              <span className="font-semibold text-ui-ink">{job.company}</span>
              {(job.normalizedLocation ?? job.location) ? ` · ${job.normalizedLocation ?? job.location}` : ""}
              {job.workMode ? ` · ${job.workMode}` : ""}
              {job.isIndiaRemote ? " · India Remote" : ""}
              {" · "}
              <span>{formatFreshness(job.postedAt, job.createdAt)}</span>
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="bg-ui-linen text-ui-ink">
                {`Level: ${job.intelligence.seniorityLevel}`}
              </Badge>
              {job.intelligence.expectedExperienceYears && (
                <Badge className="bg-ui-linen text-ui-ink">
                  {`Experience: ${job.intelligence.expectedExperienceYears}`}
                </Badge>
              )}
              {job.experienceLevel && (
                <Badge className="bg-ui-linen text-ui-ink">
                  {`Req. exp: ${formatExperienceLevel(job.experienceLevel)}`}
                </Badge>
              )}
              {job.salaryText && (
                <Badge className="bg-emerald-50 text-emerald-700">
                  {`Salary: ${job.salaryCurrency ? job.salaryCurrency + " " : ""}${job.salaryText}`}
                </Badge>
              )}
              <Badge className="bg-ui-linen text-ui-ink">{`Source: ${job.source}`}</Badge>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ui-border bg-white px-3 py-2 text-xs font-medium text-ui-ink hover:bg-ui-canvas"
            >
              <span>Original posting</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <Button
              variant={isSaved ? "primary" : "secondary"}
              className="px-3 py-2 text-xs"
              loading={busy}
              onClick={handleToggleSave}
            >
              <Bookmark className="mr-1.5 inline h-3.5 w-3.5" />
              {isSaved ? "Saved" : "Save"}
            </Button>

            <Button
              variant="ghost"
              className="px-3 py-2 text-xs"
              loading={busy}
              onClick={handleDismiss}
            >
              <EyeOff className="mr-1.5 inline h-3.5 w-3.5" />
              {job.userState === "dismissed" ? "Restore" : "Dismiss"}
            </Button>

            <Link href={`/studio?tab=tailored&jobId=${job.id}`}>
              <Button variant="secondary" className="px-3 py-2 text-xs">
                <FileText className="mr-1.5 inline h-3.5 w-3.5" />
                Tailor Resume
              </Button>
            </Link>

            <Link href={`/studio?tab=cover-letters&jobId=${job.id}`}>
              <Button variant="secondary" className="px-3 py-2 text-xs">
                Draft Cover Letter
              </Button>
            </Link>

            {job.applicationId ? (
              <Link href="/applications">
                <Button className="px-3 py-2 text-xs">View in Tracker</Button>
              </Link>
            ) : (
              <Button className="px-3 py-2 text-xs" loading={busy} onClick={handleMarkApplied}>
                Mark Applied
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column: Intelligent Match Analysis */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <Card>
            <CardHeader
              title="Match Analysis"
              description="Transparent fit evaluation comparing your verified profile against this posting."
            />

            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-1 flex justify-between text-xs font-medium text-ui-ink">
                  <span>Overall Personalized Fit</span>
                  <span>{job.match.score}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-ui-linen">
                  <div
                    className={`h-full rounded-full ${barTone(job.match.score)}`}
                    style={{ width: `${job.match.score}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-100 bg-ui-canvas p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-ui-muted">Skills compatibility</span>
                    <span className="text-sm font-semibold text-ui-ink">
                      {job.match.skillsScore}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${barTone(job.match.skillsScore)}`}
                      style={{ width: `${job.match.skillsScore}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-100 bg-ui-canvas p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-ui-muted">Experience fit</span>
                    <span className="text-sm font-semibold text-ui-ink">
                      {job.match.experienceScore}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${barTone(job.match.experienceScore)}`}
                      style={{ width: `${job.match.experienceScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {job.match.adjacencyReason && (
                <div className="flex items-start gap-2.5 rounded-lg border border-ui-lilac bg-ui-lilac-soft/70 p-3 text-xs text-ui-ink">
                  <Compass className="mt-0.5 h-4 w-4 shrink-0 text-ui-violet" />
                  <div>
                    <p className="font-semibold text-ui-ink">Adjacent role insight</p>
                    <p className="mt-0.5 leading-relaxed">{job.match.adjacencyReason}</p>
                  </div>
                </div>
              )}

              {job.match.reasons.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ui-muted">
                    <Sparkles className="h-3.5 w-3.5 text-ui-violet" />
                    <span>Why recommended</span>
                  </p>
                  <ul className="flex flex-col gap-1.5 text-xs text-ui-ink">
                    {job.match.reasons.map((r) => (
                      <li key={r} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {job.match.strengths.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Strengths
                  </p>
                  <ul className="flex flex-col gap-1 text-xs text-ui-ink">
                    {job.match.strengths.map((s) => (
                      <li key={s}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {job.match.gaps.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Missing Requirements & Gaps
                  </p>
                  <ul className="flex flex-col gap-1 text-xs text-ui-ink">
                    {job.match.gaps.map((g) => (
                      <li key={g}>• {g}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Transferable Skills"
              description="Skills from your profile that bridge missing technical requirements."
            />
            {job.match.transferableSkills.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {job.match.transferableSkills.map((item) => (
                  <li
                    key={`${item.candidateSkill}-${item.targetSkill}`}
                    className="rounded-lg border border-sky-100 bg-sky-50/50 p-3 text-xs"
                  >
                    <p className="flex items-center gap-1.5 font-semibold text-ui-ink">
                      <span>{item.candidateSkill}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-sky-600" />
                      <span>{item.targetSkill}</span>
                    </p>
                    <p className="mt-1 leading-relaxed text-ui-body">{item.reason}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ui-muted">
                No transferable skill gaps needed — your direct skills already cover the core stack or none were mapped for missing tags.
              </p>
            )}
          </Card>
        </div>

        {/* Right column: Job Intelligence (Details, Responsibilities, Requirements) */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          <Card>
            <CardHeader
              title="Job Details"
              description="Company context, seniority expectations, and role overview."
            />
            <p className="text-sm leading-relaxed text-ui-ink">{job.intelligence.summary}</p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {job.intelligence.companyAndRoleHighlights.map((hl) => (
                <div
                  key={hl}
                  className="flex items-center gap-2 rounded-lg border border-slate-100 bg-ui-canvas px-3 py-2 text-xs font-medium text-ui-ink"
                >
                  <Briefcase className="h-3.5 w-3.5 shrink-0 text-ui-muted" />
                  <span>{hl}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Responsibilities"
              description="What this role focuses on day-to-day."
            />
            <ul className="flex flex-col gap-2.5 text-sm leading-relaxed text-ui-ink">
              {job.intelligence.responsibilities.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ui-wine" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="Requirements"
              description="Required vs. preferred skills, technical depth, and seniority expectations."
            />
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-muted">
                  Required Skills
                </p>
                {job.intelligence.requiredSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {job.intelligence.requiredSkills.map((skill) => {
                      const matched = job.match.matchedSkills.some(
                        (m) => m.toLowerCase() === skill.toLowerCase()
                      );
                      return (
                        <Badge
                          key={`req-${skill}`}
                          className={
                            matched
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-ui-linen text-ui-ink"
                          }
                        >
                          {matched ? `✓ ${skill}` : skill}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-ui-muted">No specific keyword tags detected.</p>
                )}
              </div>

              {job.intelligence.preferredSkills.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-muted">
                    Preferred / Bonus Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.intelligence.preferredSkills.map((skill) => (
                      <Badge key={`pref-${skill}`} className="bg-amber-50 text-amber-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {job.intelligence.technicalRequirements.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-muted">
                    Technical Requirements & Engineering Scope
                  </p>
                  <ul className="flex flex-col gap-2 text-sm leading-relaxed text-ui-ink">
                    {job.intelligence.technicalRequirements.map((req) => (
                      <li key={req} className="flex items-start gap-2.5">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRawDescription((prev) => !prev)}
                  className="text-xs font-medium text-ui-violet hover:underline"
                >
                  {showRawDescription
                    ? "Hide full job posting description"
                    : "Show full job posting description"}
                </button>
                {showRawDescription && (
                  <p className="mt-3 whitespace-pre-line rounded-lg bg-ui-canvas p-4 text-xs leading-relaxed text-ui-ink">
                    {job.description}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

