"use client";

import Link from "next/link";
import type {
  ApplicationDto,
  AuditLogDto,
  JobDto,
  ProfileDto,
  ResumeDto,
} from "@/lib/types";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import {
  ExploreAdjacentRoles,
  OpportunitySnapshot,
} from "@/components/dashboard/opportunity-sections";
import {
  ApplicationProgressPanel,
  NextActionsPanel,
  ProfileReadinessPanel,
  RecentActivityPanel,
} from "@/components/dashboard/command-center-panels";
import { summarizeApplicationProgress } from "@/lib/dashboard-helpers";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <DashboardContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useApi<ProfileDto>("/profile");
  const {
    data: resumes,
    loading: resumesLoading,
  } = useApi<ResumeDto[]>("/resumes");
  const {
    data: applications,
    loading: appsLoading,
    error: appsError,
    refetch: refetchApps,
  } = useApi<ApplicationDto[]>("/applications");
  const {
    data: jobs,
    loading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = useApi<JobDto[]>("/jobs?tab=for_you");
  const {
    data: activityLogs,
    loading: activityLoading,
  } = useApi<AuditLogDto[]>("/account/activity");

  const firstName = profile?.fullName?.trim()
    ? profile.fullName.trim().split(/\s+/)[0]
    : user?.email?.split("@")[0] ?? "";

  const appSummary = summarizeApplicationProgress(applications);
  const adjacentCount = (jobs ?? []).filter((j) => j.match.isAdjacentRole).length;
  const targetTitles = profile?.preferredTitles ?? [];

  function buildOverviewSummary(): string {
    if (profileLoading || jobsLoading || appsLoading) {
      return "Loading your personalized job search overview…";
    }
    const parts: string[] = [];
    if (jobs && jobs.length > 0) {
      parts.push(
        `${jobs.length} matched opportunit${jobs.length === 1 ? "y" : "ies"} ranked`
      );
      if (adjacentCount > 0) {
        parts.push(
          `${adjacentCount} adjacent role${adjacentCount === 1 ? "" : "s"} worth exploring`
        );
      }
    } else {
      parts.push("No synced jobs matched yet");
    }

    if (appSummary.total > 0) {
      parts.push(
        `${appSummary.activeCount} active application${appSummary.activeCount === 1 ? "" : "s"}`
      );
    }

    if (targetTitles.length > 0) {
      parts.push(`Targeting ${targetTitles.slice(0, 2).join(", ")}`);
    }
    return `${parts.join(" · ")}.`;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      {/* 1. Welcome & Overview */}
      <header className="rounded-[14px] border border-ap-line bg-ap-surface p-5 shadow-[0_1px_2px_rgba(30,25,21,0.04)] sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ap-muted">
              Job Search Command Center
            </span>
            <h1 className="mt-1 font-display text-[28px] leading-[1.15] tracking-[-0.02em] text-ap-ink sm:text-[34px]">
              Welcome back{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-1.5 text-sm text-ap-body">{buildOverviewSummary()}</p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href="/jobs"
              className="inline-flex h-9 items-center justify-center rounded-full bg-ap-ink px-4 text-xs font-medium text-ap-surface transition hover:bg-ap-body"
            >
              Discover Jobs
            </Link>
            <Link
              href="/profile"
              className="inline-flex h-9 items-center justify-center rounded-full border border-ap-line bg-ap-paper-deep px-4 text-xs font-medium text-ap-ink transition hover:bg-ap-surface-muted"
            >
              Candidate Profile
            </Link>
            <Link
              href="/studio"
              className="inline-flex h-9 items-center justify-center rounded-full border border-ap-line bg-ap-surface px-4 text-xs font-medium text-ap-ink transition hover:bg-ap-paper-deep"
            >
              Resume Studio
            </Link>
          </div>
        </div>

        {profileError && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-900">
            <span>Couldn&apos;t load profile data: {profileError}</span>
            <button
              type="button"
              onClick={refetchProfile}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}
      </header>

      {/* 2. Opportunity Snapshot (Primary Visual Priority) */}
      <OpportunitySnapshot
        jobs={jobs}
        loading={jobsLoading}
        error={jobsError}
        onRetry={refetchJobs}
      />

      {/* Editorial Two-Column Command Grid */}
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="min-w-0 space-y-6 lg:col-span-7">
          {/* 3. Explore Adjacent Roles */}
          <ExploreAdjacentRoles
            jobs={jobs}
            profile={profile}
            loading={jobsLoading || profileLoading}
          />

          {/* 4. Next Actions */}
          <NextActionsPanel
            profile={profile}
            resumes={resumes}
            applications={applications}
            jobs={jobs}
            loading={profileLoading || resumesLoading || appsLoading || jobsLoading}
          />
        </div>

        <div className="min-w-0 space-y-6 lg:col-span-5">
          {/* 5. Application Progress */}
          <ApplicationProgressPanel
            applications={applications}
            loading={appsLoading}
            error={appsError}
            onRetry={refetchApps}
          />

          {/* 6. Profile Readiness */}
          <ProfileReadinessPanel
            profile={profile}
            resumes={resumes}
            loading={profileLoading || resumesLoading}
          />

          {/* 7. Recent Activity */}
          <RecentActivityPanel
            auditLogs={activityLogs}
            applications={applications}
            jobs={jobs}
            loading={activityLoading && appsLoading && jobsLoading}
          />
        </div>
      </div>
    </div>
  );
}
