"use client";

import Link from "next/link";
import type { JobDto, ProfileDto } from "@/lib/types";

interface OpportunitySnapshotProps {
  jobs: JobDto[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function matchPillClass(score: number): string {
  if (score >= 75) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (score >= 55) {
    return "bg-amber-50 text-ui-ink border-amber-300/60";
  }
  return "bg-ui-linen text-ui-body border-ui-border";
}

function formatWorkMode(mode: string | null): string | null {
  if (!mode) return null;
  if (mode === "onsite") return "On-site";
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

export function OpportunitySnapshot({
  jobs,
  loading,
  error,
  onRetry,
}: OpportunitySnapshotProps) {
  const allJobs = jobs ?? [];
  const directMatches = allJobs.filter((j) => !j.match.isAdjacentRole);
  const adjacentFallback = allJobs.filter((j) => j.match.isAdjacentRole);
  const bestMatches = [...directMatches, ...adjacentFallback].slice(0, 4);

  return (
    <section
      aria-labelledby="opportunity-snapshot-heading"
      className="rounded-2xl border border-ui-border bg-ui-surface p-6"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-ui-border pb-4">
        <div>
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ui-violet">
            Priority Feed · Opportunity Snapshot
          </span>
          <h2
            id="opportunity-snapshot-heading"
            className="mt-1 text-[24px] leading-[1.2] tracking-[-0.015em] text-ui-ink"
          >
            Best Matching Opportunities
          </h2>
          <p className="mt-1 text-sm text-ui-muted">
            Live roles ranked transparently against your confirmed skills, target titles, and preferences.
          </p>
        </div>

        <Link
          href="/jobs?tab=for-you"
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-ui-border bg-ui-linen px-4 text-xs font-medium text-ui-ink transition hover:bg-ui-linen"
        >
          Browse all matches →
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl border border-ui-border bg-ui-linen"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-medium">Couldn&apos;t load job matches.</p>
          <p className="mt-1 text-xs text-red-700">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-full bg-red-700 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      ) : bestMatches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ui-border bg-ui-linen/50 p-6 text-center">
          <p className="text-lg text-ui-ink">
            No live opportunities matched yet
          </p>
          <p className="mx-auto mt-1 max-w-lg text-sm text-ui-muted">
            Sync live roles in Discover Jobs or confirm your core skills and target roles in your profile to surface transparent matches.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
            <Link
              href="/jobs"
              className="inline-flex h-9 items-center justify-center rounded-full bg-ui-wine px-4 text-xs font-medium text-ap-surface hover:bg-ui-wine-hover"
            >
              Sync & explore jobs
            </Link>
            <Link
              href="/profile"
              className="inline-flex h-9 items-center justify-center rounded-full border border-ui-border bg-ui-surface px-4 text-xs font-medium text-ui-ink hover:bg-ui-linen"
            >
              Update profile
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bestMatches.map((job) => {
            const workModeLabel = formatWorkMode(job.workMode);
            const reasonText =
              job.match.reasons[0] ??
              job.match.strengths[0] ??
              "Scored against your profile qualifications";
            return (
              <article
                key={job.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-ui-border bg-ui-linen/35 p-4 transition hover:border-ap-muted"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-ui-muted">
                        {job.company}
                        {workModeLabel ? ` · ${workModeLabel}` : ""}
                      </p>
                      <h3 className="mt-1 text-base font-semibold leading-snug text-ui-ink">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="hover:text-ui-violet hover:underline"
                        >
                          {job.title}
                        </Link>
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-ui-muted">
                        {job.location || "Location flexible"}
                        {job.applicationStatus ? ` · ${job.applicationStatus}` : ""}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 font-mono text-xs font-semibold ${matchPillClass(
                        job.match.score
                      )}`}
                    >
                      {job.match.score}% fit
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs leading-relaxed text-ui-body">
                    {reasonText}
                  </p>

                  {job.match.matchedSkills.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {job.match.matchedSkills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-ui-border bg-ui-surface px-2 py-0.5 text-[11px] font-medium text-ui-body"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ui-border/70 pt-3">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-xs font-medium text-ui-ink hover:text-ui-violet hover:underline"
                  >
                    Inspect breakdown →
                  </Link>
                  <Link
                    href={`/studio?tab=tailored&jobId=${job.id}`}
                    className="inline-flex h-8 items-center justify-center rounded-full bg-ui-wine px-3.5 text-xs font-medium text-ap-surface transition hover:bg-ui-wine-hover"
                  >
                    Tailor resume
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

interface ExploreAdjacentRolesProps {
  jobs: JobDto[] | null;
  profile: ProfileDto | null;
  loading: boolean;
}

export function ExploreAdjacentRoles({
  jobs,
  profile,
  loading,
}: ExploreAdjacentRolesProps) {
  const adjacentJobs = (jobs ?? [])
    .filter((job) => job.match.isAdjacentRole)
    .slice(0, 3);
  const savedAdjacentTracks = profile?.adjacentRoles ?? [];
  const aiAdjacentTracks = (profile?.intelligence?.aiSuggestedRoles ?? []).filter(
    (s) => s.kind === "adjacent"
  );

  return (
    <section
      aria-labelledby="adjacent-roles-heading"
      className="rounded-2xl border border-ui-border bg-ui-surface p-6"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-ui-border pb-4">
        <div>
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ui-muted">
            Beyond Conventional Titles
          </span>
          <h2
            id="adjacent-roles-heading"
            className="mt-1 text-[22px] leading-[1.2] tracking-[-0.015em] text-ui-ink"
          >
            Explore Adjacent Roles
          </h2>
          <p className="mt-1 text-sm text-ui-muted">
            Alternative career tracks where your verified and transferable skills already give you leverage.
          </p>
        </div>

        <Link
          href="/jobs?tab=adjacent"
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-ui-border bg-ui-linen px-4 text-xs font-medium text-ui-ink transition hover:bg-ui-linen"
        >
          Adjacent feed →
        </Link>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-ui-linen" />
      ) : (
        <div className="space-y-4">
          {adjacentJobs.length > 0 ? (
            <div className="space-y-2.5">
              {adjacentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-ui-border bg-ui-linen/35 p-3.5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="truncate text-sm font-semibold text-ui-ink hover:text-ui-violet hover:underline"
                      >
                        {job.title}
                      </Link>
                      <span className="rounded-full bg-ui-lilac-soft px-2 py-0.5 font-mono text-[10px] font-medium text-ui-violet">
                        Adjacent fit
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-ui-muted">
                      {job.company}
                      {job.location ? ` · ${job.location}` : ""}
                    </p>
                    {job.match.adjacencyReason && (
                      <p className="mt-1 text-xs text-ui-body">
                        {job.match.adjacencyReason}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <span className="font-mono text-xs font-semibold text-ui-ink">
                      {job.match.score}%
                    </span>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="inline-flex h-8 items-center justify-center rounded-full border border-ui-border bg-ui-surface px-3 text-xs font-medium text-ui-ink hover:bg-ui-linen"
                    >
                      Explore
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-ui-border bg-ui-linen/40 p-4 text-sm text-ui-muted">
              No adjacent role postings surfaced in your current feed yet. Add confirmed skills or check the{" "}
              <Link href="/jobs?tab=adjacent" className="font-medium text-ui-violet hover:underline">
                Adjacent Roles tab
              </Link>{" "}
              after syncing jobs.
            </div>
          )}

          {(savedAdjacentTracks.length > 0 || aiAdjacentTracks.length > 0) && (
            <div className="border-t border-ui-border pt-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ui-muted">
                  Adjacent Role Tracks
                </span>
                <Link
                  href="/profile#section-career_interests"
                  className="text-xs font-medium text-ui-violet hover:underline"
                >
                  Edit in Career Interests →
                </Link>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {savedAdjacentTracks.map((role) => (
                  <Link
                    key={role}
                    href="/jobs?tab=adjacent"
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                  >
                    ✓ {role}
                  </Link>
                ))}
                {aiAdjacentTracks.slice(0, 3).map((sug) => (
                  <Link
                    key={sug.role}
                    href="/profile#section-career_interests"
                    title={sug.reason}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ap-vermilion/25 bg-ui-lilac-soft px-2.5 py-1 text-xs font-medium text-ui-violet"
                  >
                    {sug.role}
                    <span className="font-mono text-[10px] opacity-80">
                      AI-suggested
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

