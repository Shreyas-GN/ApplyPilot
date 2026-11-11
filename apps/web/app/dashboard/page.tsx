"use client";

import Link from "next/link";
import type { ProfileDto, ResumeDto } from "@/lib/types";
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
