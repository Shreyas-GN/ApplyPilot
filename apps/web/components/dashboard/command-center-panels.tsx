"use client";

import Link from "next/link";
import type {
  ApplicationDto,
  AuditLogDto,
  JobDto,
  ProfileDto,
  ResumeDto,
} from "@/lib/types";
import { StatusBadge } from "@/components/ui/badge";
import {
  buildNextActions,
  buildRecentActivity,
  summarizeApplicationProgress,
  summarizeProfileReadiness,
} from "@/lib/dashboard-helpers";

export function NextActionsPanel({
  profile,
  resumes,
  applications,
  jobs,
  loading,
}: {
  profile: ProfileDto | null;
  resumes: ResumeDto[] | null;
  applications: ApplicationDto[] | null;
  jobs: JobDto[] | null;
  loading: boolean;
}) {
  const actions = buildNextActions({ profile, resumes, applications, jobs });

  return (
    <section
      aria-labelledby="next-actions-heading"
      className="rounded-[14px] border border-ap-line bg-ap-surface p-5 shadow-[0_1px_2px_rgba(30,25,21,0.04)] sm:p-6"
    >
      <div className="mb-4 border-b border-ap-line pb-3.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ap-muted">
          Recommended Workflow
        </span>
        <h2
          id="next-actions-heading"
          className="mt-1 font-display text-[22px] leading-[1.2] tracking-[-0.015em] text-ap-ink"
        >
          Next Actions
        </h2>
      </div>

      {loading ? (
        <div className="h-28 animate-pulse rounded-xl bg-ap-surface-muted" />
      ) : actions.length === 0 ? (
        <div className="rounded-xl border border-ap-sage/30 bg-ap-sage-soft/50 p-4 text-sm text-ap-body">
          All readiness milestones are complete. Keep reviewing new{" "}
          <Link href="/jobs?tab=for-you" className="font-medium text-ap-ink underline">
            matched roles
          </Link>{" "}
          and tailoring applications.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {actions.map((item) => (
            <li
              key={item.id}
              className={`flex flex-col justify-between gap-2.5 rounded-xl border p-3.5 sm:flex-row sm:items-center ${
                item.priority === "high"
                  ? "border-ap-vermilion/30 bg-ap-vermilion-soft/30"
                  : "border-ap-line bg-ap-paper-deep/35"
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-ap-ink">
                    {item.title}
                  </p>
                  {item.priority === "high" && (
                    <span className="rounded-full bg-ap-vermilion-soft px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-ap-vermilion">
                      Priority
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-ap-muted">
                  {item.description}
                </p>
              </div>
              <Link
                href={item.href}
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-ap-line bg-ap-surface px-3.5 text-xs font-medium text-ap-ink transition hover:bg-ap-paper-deep"
              >
                {item.cta} →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const PROGRESS_STAGES = [
  { key: "saved", label: "Saved", tone: "border-ap-line bg-ap-paper-deep/45 text-ap-ink" },
  { key: "applied", label: "Applied", tone: "border-ap-line bg-ap-paper-deep/45 text-ap-ink" },
  { key: "interviewing", label: "Interviewing", tone: "border-amber-300 bg-ap-butter/35 text-ap-ink" },
  { key: "offer", label: "Offered", tone: "border-ap-sage/35 bg-ap-sage-soft/70 text-ap-sage" },
  { key: "rejected", label: "Rejected", tone: "border-ap-line bg-ap-surface-muted text-ap-muted" },
] as const;

export function ApplicationProgressPanel({
  applications,
  loading,
  error,
  onRetry,
}: {
  applications: ApplicationDto[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const summary = summarizeApplicationProgress(applications);

  return (
    <section
      aria-labelledby="application-progress-heading"
      className="rounded-[14px] border border-ap-line bg-ap-surface p-5 shadow-[0_1px_2px_rgba(30,25,21,0.04)] sm:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-ap-line pb-3.5">
        <div>
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ap-muted">
            Pipeline Summary
          </span>
          <h2
            id="application-progress-heading"
            className="mt-1 font-display text-[22px] leading-[1.2] tracking-[-0.015em] text-ap-ink"
          >
            Application Progress
          </h2>
        </div>

        <Link
          href="/applications"
          className="text-xs font-medium text-ap-vermilion hover:underline"
        >
          Open tracker →
        </Link>
      </div>

      {loading ? (
        <div className="h-24 animate-pulse rounded-xl bg-ap-surface-muted" />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-900">
          <p>{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 font-medium underline"
          >
            Retry
          </button>
        </div>
      ) : summary.total === 0 ? (
        <div className="rounded-xl border border-dashed border-ap-line bg-ap-paper-deep/40 p-4 text-sm text-ap-muted">
          No applications tracked yet. Save promising roles from{" "}
          <Link href="/jobs" className="font-medium text-ap-vermilion hover:underline">
            Discover Jobs
          </Link>{" "}
          or add one in{" "}
          <Link href="/applications" className="font-medium text-ap-vermilion hover:underline">
            Applications
          </Link>
          .
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {PROGRESS_STAGES.map((stage) => (
              <Link
                key={stage.key}
                href="/applications"
                className={`rounded-xl border p-2.5 transition hover:opacity-90 ${stage.tone}`}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.04em] opacity-80">
                  {stage.label}
                </p>
                <p className="mt-1 font-mono text-xl font-semibold">
                  {summary.counts[stage.key]}
                </p>
              </Link>
            ))}
          </div>

          {summary.followUpsCount > 0 && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-300 bg-ap-butter/40 px-3 py-2 text-xs text-ap-ink">
              <span>
                {summary.followUpsCount} scheduled follow-up reminder
                {summary.followUpsCount === 1 ? "" : "s"}
              </span>
              <Link
                href="/applications?view=list"
                className="font-semibold text-ap-vermilion hover:underline"
              >
                Review →
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function ProfileReadinessPanel({
  profile,
  resumes,
  loading,
}: {
  profile: ProfileDto | null;
  resumes: ResumeDto[] | null;
  loading: boolean;
}) {
  const readiness = summarizeProfileReadiness(profile, resumes);

  return (
    <section
      aria-labelledby="profile-readiness-heading"
      className="rounded-[14px] border border-ap-line bg-ap-surface p-5 shadow-[0_1px_2px_rgba(30,25,21,0.04)] sm:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-ap-line pb-3.5">
        <div>
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ap-muted">
            Candidate Readiness
          </span>
          <h2
            id="profile-readiness-heading"
            className="mt-1 font-display text-[22px] leading-[1.2] tracking-[-0.015em] text-ap-ink"
          >
            Profile Readiness
          </h2>
        </div>

        <Link
          href="/profile"
          className="text-xs font-medium text-ap-vermilion hover:underline"
        >
          Edit dossier →
        </Link>
      </div>

      {loading ? (
        <div className="h-28 animate-pulse rounded-xl bg-ap-surface-muted" />
      ) : (
        <div className="space-y-4">
          {/* Completeness */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-ap-body">
                Confirmed profile completeness
              </span>
              <span className="font-mono text-lg font-semibold text-ap-ink">
                {readiness.confirmedPercent}%
              </span>
            </div>
            <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-ap-surface-muted">
              <div
                className="h-full bg-ap-sage transition-all"
                style={{ width: `${readiness.confirmedPercent}%` }}
              />
            </div>
            {readiness.unverifiedAiCount > 0 && (
              <p className="mt-1.5 text-xs text-ap-ink">
                {readiness.unverifiedAiCount} AI-extracted item
                {readiness.unverifiedAiCount === 1 ? "" : "s"} awaiting your confirmation (
                <Link href="/profile" className="font-medium text-ap-vermilion hover:underline">
                  review in Profile
                </Link>
                ).
              </p>
            )}
          </div>

          {/* Primary Resume Status */}
          <div className="rounded-xl border border-ap-line bg-ap-paper-deep/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ap-muted">
                Primary Resume
              </span>
              <Link
                href="/resumes"
                className="text-xs font-medium text-ap-vermilion hover:underline"
              >
                Manage →
              </Link>
            </div>
            {readiness.primaryResume ? (
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-ap-ink">
                  {readiness.primaryResume.versionLabel}
                </p>
                <StatusBadge
                  status={
                    readiness.primaryResume.reviewStatus === "confirmed"
                      ? "confirmed"
                      : readiness.primaryResume.processingStatus
                  }
                />
              </div>
            ) : (
              <p className="mt-1 text-xs text-ap-muted">
                No resume uploaded yet.{" "}
                <Link href="/resumes" className="font-medium text-ap-vermilion hover:underline">
                  Upload PDF or DOCX
                </Link>
              </p>
            )}
          </div>

          {/* Missing Information */}
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.06em] text-ap-muted">
              {readiness.missingSections.length > 0
                ? "Missing or Unverified Information"
                : "Section Coverage"}
            </p>
            {readiness.missingSections.length === 0 ? (
              <p className="text-xs text-ap-sage">
                All 9 Candidate Intelligence sections have verified entries.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {readiness.missingSections.map((sec) => (
                  <Link
                    key={sec.id}
                    href={`/profile#section-${sec.id}`}
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${
                      sec.aiUnverifiedCount > 0
                        ? "border-amber-300 bg-ap-butter/60 text-ap-ink"
                        : "border-ap-line bg-ap-paper-deep text-ap-body hover:text-ap-ink"
                    }`}
                  >
                    {sec.label}
                    {sec.aiUnverifiedCount > 0 ? " (verify AI)" : ""}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export function RecentActivityPanel({
  auditLogs,
  applications,
  jobs,
  loading,
}: {
  auditLogs: AuditLogDto[] | null;
  applications: ApplicationDto[] | null;
  jobs: JobDto[] | null;
  loading: boolean;
}) {
  const activity = buildRecentActivity({ auditLogs, applications, jobs });

  return (
    <section
      aria-labelledby="recent-activity-heading"
      className="rounded-[14px] border border-ap-line bg-ap-surface p-5 shadow-[0_1px_2px_rgba(30,25,21,0.04)] sm:p-6"
    >
      <div className="mb-4 border-b border-ap-line pb-3.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ap-muted">
          Chronological Log
        </span>
        <h2
          id="recent-activity-heading"
          className="mt-1 font-display text-[22px] leading-[1.2] tracking-[-0.015em] text-ap-ink"
        >
          Recent Activity
        </h2>
      </div>

      {loading ? (
        <div className="h-24 animate-pulse rounded-xl bg-ap-surface-muted" />
      ) : activity.length === 0 ? (
        <p className="text-sm text-ap-muted">
          No recent activity yet. Updates to your profile, saved jobs, resumes, and application statuses will appear here.
        </p>
      ) : (
        <ul className="divide-y divide-ap-line/70">
          {activity.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <Link
                  href={item.href}
                  className="block truncate text-xs font-medium text-ap-ink hover:text-ap-vermilion hover:underline"
                >
                  {item.title}
                </Link>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[10px] uppercase text-ap-muted">
                    {item.category}
                  </span>
                  {item.statusLabel && (
                    <span className="rounded-full bg-ap-paper-deep px-2 py-0.5 text-[10px] font-medium text-ap-body">
                      {item.statusLabel}
                    </span>
                  )}
                </div>
              </div>
              <time
                dateTime={item.timestamp}
                className="shrink-0 font-mono text-[11px] text-ap-muted"
              >
                {new Date(item.timestamp).toLocaleDateString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

