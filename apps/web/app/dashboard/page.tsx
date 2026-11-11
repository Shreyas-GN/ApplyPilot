"use client";

import Link from "next/link";
import type { ApplicationDto, JobDto, ProfileDto, ResumeDto } from "@/lib/types";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
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
  const { data: profile, loading: profileLoading } = useApi<ProfileDto>("/profile");
  const { data: resumes, loading: resumesLoading } = useApi<ResumeDto[]>("/resumes");
  const { data: applications, loading: appsLoading } = useApi<ApplicationDto[]>("/applications");
  const { data: jobs, loading: jobsLoading } = useApi<JobDto[]>("/jobs");

  const primaryResume = resumes?.find((r) => r.isPrimary) ?? resumes?.[0] ?? null;
  const needsReview = resumes?.find(
    (r) => r.processingStatus === "parsed" && r.reviewStatus !== "confirmed",
  );

  const nextActions: { label: string; href: string }[] = [];
  if (!resumes || resumes.length === 0) {
    nextActions.push({ label: "Upload your resume", href: "/resumes" });
  }
  if (needsReview) {
    nextActions.push({ label: "Review your parsed resume", href: `/resumes/${needsReview.id}/review` });
  }
  if (profile && profile.completionPercent < 100) {
    nextActions.push({ label: "Finish your profile", href: "/profile" });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back{user ? `, ${user.email.split("@")[0]}` : ""}</h1>
        <p className="mt-1 text-sm text-slate-500">Here&apos;s where your job search stands.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Profile completion</p>
          {profileLoading ? (
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-1 text-3xl font-semibold text-slate-900">{profile?.completionPercent ?? 0}%</p>
          )}
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-brand-500"
              style={{ width: `${profile?.completionPercent ?? 0}%` }}
            />
          </div>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">Primary resume</p>
          {resumesLoading ? (
            <div className="mt-2 h-8 w-32 animate-pulse rounded bg-slate-100" />
          ) : primaryResume ? (
            <div className="mt-1">
              <p className="truncate font-medium text-slate-900">{primaryResume.versionLabel}</p>
              <div className="mt-2">
                <StatusBadge status={primaryResume.reviewStatus === "confirmed" ? "confirmed" : primaryResume.processingStatus} />
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-400">No resume uploaded yet.</p>
          )}
        </Card>

        <Card>
          <p className="text-sm text-slate-500">Job search preferences</p>
          {profileLoading ? (
            <div className="mt-2 h-8 w-32 animate-pulse rounded bg-slate-100" />
          ) : profile && (profile.preferredTitles.length > 0 || profile.workMode) ? (
            <div className="mt-1 text-sm text-slate-700">
              {profile.preferredTitles.length > 0 && <p>{profile.preferredTitles.join(", ")}</p>}
              {profile.workMode && <p className="text-slate-500 capitalize">{profile.workMode}</p>}
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-400">Not set yet.</p>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Next actions" />
        {nextActions.length === 0 ? (
          <p className="text-sm text-slate-500">You&apos;re all caught up. Nice work.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {nextActions.map((action) => (
              <li key={action.href} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{action.label}</span>
                <Link href={action.href}>
                  <Button variant="secondary">Go</Button>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Top job matches"
            action={
              <Link href="/jobs" className="text-xs font-medium text-brand-600 hover:underline">
                View all →
              </Link>
            }
          />
          {jobsLoading ? (
            <div className="h-24 animate-pulse rounded bg-slate-100" />
          ) : jobs && jobs.length > 0 ? (
            <ul className="flex flex-col divide-y divide-slate-100">
              {jobs.slice(0, 3).map((job) => (
                <li key={job.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="block truncate font-medium text-slate-900 hover:text-brand-700 hover:underline"
                    >
                      {job.title}
                    </Link>
                    <p className="truncate text-xs text-slate-500">
                      {job.company}
                      {job.location ? ` · ${job.location}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                      {job.match.score}%
                    </span>
                    <Link
                      href={`/studio?tab=tailored&jobId=${job.id}`}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      Tailor
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">
              No synced roles yet — visit{" "}
              <Link href="/jobs" className="text-brand-600 hover:underline">
                Jobs
              </Link>{" "}
              to sync live postings.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Application pipeline"
            action={
              <Link href="/applications" className="text-xs font-medium text-brand-600 hover:underline">
                Open tracker →
              </Link>
            }
          />
          {appsLoading ? (
            <div className="h-24 animate-pulse rounded bg-slate-100" />
          ) : applications && applications.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["saved", "applied", "interviewing", "offer"] as const).map((st) => {
                const count = applications.filter((a) => a.status === st).length;
                return (
                  <div key={st} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs capitalize text-slate-500">{st}</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">{count}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              No tracked applications yet — save roles from Jobs or add one in Applications.
            </p>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent activity" />
        {resumesLoading ? (
          <div className="h-16 animate-pulse rounded bg-slate-100" />
        ) : resumes && resumes.length > 0 ? (
          <ul className="flex flex-col divide-y divide-slate-100">
            {resumes.slice(0, 5).map((resume) => (
              <li key={resume.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">{resume.versionLabel}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={resume.processingStatus} />
                  <span className="text-slate-400">{new Date(resume.createdAt).toLocaleDateString()}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No activity yet — upload a resume to get started.</p>
        )}
      </Card>
    </div>
  );
}
