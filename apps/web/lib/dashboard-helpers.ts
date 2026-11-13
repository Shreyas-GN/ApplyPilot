import type {
  ApplicationDto,
  ApplicationStatus,
  AuditLogDto,
  JobDto,
  ProfileDto,
  ResumeDto,
} from "@/lib/types";

export interface DashboardActionItem {
  id: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  priority: "high" | "medium" | "low";
}

export interface ApplicationProgressSummary {
  total: number;
  activeCount: number;
  followUpsCount: number;
  counts: Record<ApplicationStatus, number>;
}

export interface ProfileReadinessSummary {
  confirmedPercent: number;
  totalWithAiPercent: number;
  unverifiedAiCount: number;
  primaryResume: ResumeDto | null;
  needsResumeReview: ResumeDto | null;
  missingSections: Array<{
    id: string;
    label: string;
    aiUnverifiedCount: number;
  }>;
}

export interface DashboardActivityItem {
  id: string;
  title: string;
  category: "Profile" | "Resume" | "Job" | "Application" | "Tailoring" | "Account";
  statusLabel?: string;
  href: string;
  timestamp: string;
}

const SECTION_LABELS: Record<string, string> = {
  basic: "Personal info & summary",
  personal_info: "Personal information",
  professional_summary: "Professional summary",
  skills: "Skills & technologies",
  experience: "Work experience",
  education: "Education",
  projects: "Projects",
  certifications: "Certifications",
  preferences: "Career preferences & interests",
  resume_confirm: "Resume data confirmed",
};

export function summarizeApplicationProgress(
  applications: ApplicationDto[] | null | undefined
): ApplicationProgressSummary {
  const counts: Record<ApplicationStatus, number> = {
    saved: 0,
    preparing: 0,
    ready_to_apply: 0,
    applied: 0,
    interviewing: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
  };

  if (!applications || applications.length === 0) {
    return { total: 0, activeCount: 0, followUpsCount: 0, counts };
  }

  let followUpsCount = 0;
  for (const app of applications) {
    counts[app.status] = (counts[app.status] ?? 0) + 1;
    if (app.followUpAt) followUpsCount += 1;
  }

  const activeCount = counts.saved + counts.preparing + counts.ready_to_apply + counts.applied + counts.interviewing;
  return {
    total: applications.length,
    activeCount,
    followUpsCount,
    counts,
  };
}

export function summarizeProfileReadiness(
  profile: ProfileDto | null | undefined,
  resumes: ResumeDto[] | null | undefined
): ProfileReadinessSummary {
  const primaryResume =
    resumes?.find((r) => r.isPrimary) ?? resumes?.[0] ?? null;
  const needsResumeReview =
    resumes?.find(
      (r) => r.processingStatus === "parsed" && r.reviewStatus !== "confirmed"
    ) ?? null;

  const confirmedPercent =
    profile?.intelligence?.confirmedPercent ?? profile?.completionPercent ?? 0;
  const totalWithAiPercent =
    profile?.intelligence?.totalWithAiPercent ?? confirmedPercent;
  const unverifiedAiCount = profile?.intelligence?.unverifiedAiCount ?? 0;

  const missingSections = (profile?.intelligence?.sections ?? [])
    .filter((sec) => !sec.complete)
    .map((sec) => ({
      id: sec.id,
      label: sec.label,
      aiUnverifiedCount: sec.aiUnverifiedCount,
    }));

  return {
    confirmedPercent,
    totalWithAiPercent,
    unverifiedAiCount,
    primaryResume,
    needsResumeReview,
    missingSections,
  };
}

export function buildNextActions(params: {
  profile: ProfileDto | null | undefined;
  resumes: ResumeDto[] | null | undefined;
  applications: ApplicationDto[] | null | undefined;
  jobs: JobDto[] | null | undefined;
}): DashboardActionItem[] {
  const { profile, resumes, applications, jobs } = params;
  const actions: DashboardActionItem[] = [];
  const readiness = summarizeProfileReadiness(profile, resumes);

  if (resumes && resumes.length === 0) {
    actions.push({
      id: "upload-resume",
      title: "Upload your base resume",
      description:
        "Parse your background once to prefill experience, skills, and education cleanly.",
      cta: "Upload resume",
      href: "/resumes",
      priority: "high",
    });
  }

  if (readiness.needsResumeReview) {
    actions.push({
      id: "review-resume",
      title: "Review parsed resume extraction",
      description: `Confirm extracted entries from ${readiness.needsResumeReview.versionLabel}.`,
      cta: "Review extraction",
      href: `/resumes/${readiness.needsResumeReview.id}/review`,
      priority: "high",
    });
  }

  if (readiness.unverifiedAiCount > 0) {
    actions.push({
      id: "verify-ai-profile",
      title: `Confirm ${readiness.unverifiedAiCount} AI-extracted profile ${
        readiness.unverifiedAiCount === 1 ? "entry" : "entries"
      }`,
      description:
        "Unverified AI entries stay excluded from job match scoring until you confirm them.",
      cta: "Review profile",
      href: "/profile",
      priority: "high",
    });
  }

  if (profile && readiness.confirmedPercent < 100) {
    const missingNames = readiness.missingSections
      .slice(0, 3)
      .map((s) => s.label)
      .join(", ");
    actions.push({
      id: "complete-profile",
      title: `Strengthen profile readiness (${readiness.confirmedPercent}%)`,
      description: missingNames
        ? `Incomplete sections: ${missingNames}.`
        : "Fill remaining dossier fields to sharpen match scoring.",
      cta: "Update profile",
      href: "/profile",
      priority: readiness.confirmedPercent < 50 ? "high" : "medium",
    });
  }

  const savedPendingApp = applications?.find(
    (app) =>
      app.status === "saved" &&
      (!app.readiness || !app.readiness.tailoredResume || !app.readiness.finalReviewed)
  );
  if (savedPendingApp) {
    actions.push({
      id: `prepare-app-${savedPendingApp.id}`,
      title: `Prepare application for ${savedPendingApp.company}`,
      description: `${savedPendingApp.title} is saved and ready for tailoring & final review.`,
      cta: savedPendingApp.jobId ? "Tailor materials" : "Open tracker",
      href: savedPendingApp.jobId
        ? `/studio?tab=tailored&jobId=${savedPendingApp.jobId}`
        : "/applications",
      priority: "medium",
    });
  }

  const followUpsCount =
    applications?.filter((app) => Boolean(app.followUpAt)).length ?? 0;
  if (followUpsCount > 0) {
    actions.push({
      id: "follow-ups",
      title: `Check ${followUpsCount} scheduled follow-up${followUpsCount === 1 ? "" : "s"}`,
      description: "Stay current on outreach and recruiter replies.",
      cta: "Review tracker",
      href: "/applications?view=list",
      priority: "medium",
    });
  }

  if (jobs && jobs.length === 0) {
    actions.push({
      id: "explore-jobs",
      title: "Discover & sync open opportunities",
      description:
        "Pull live roles and rank matches against your confirmed profile.",
      cta: "Discover jobs",
      href: "/jobs",
      priority: "medium",
    });
  } else if (jobs && jobs.some((j) => j.match.isAdjacentRole)) {
    actions.push({
      id: "explore-adjacent",
      title: "Explore adjacent role matches",
      description:
        "Inspect roles outside your usual title where your skills transfer strongly.",
      cta: "View adjacent",
      href: "/jobs?tab=adjacent",
      priority: "low",
    });
  }

  return actions.slice(0, 5);
}

export function buildRecentActivity(params: {
  auditLogs: AuditLogDto[] | null | undefined;
  applications: ApplicationDto[] | null | undefined;
  jobs: JobDto[] | null | undefined;
}): DashboardActivityItem[] {
  const { auditLogs, applications, jobs } = params;
  const items: DashboardActivityItem[] = [];

  for (const log of auditLogs ?? []) {
    const meta = log.metadata ?? {};
    if (log.action === "profile_updated") {
      const sec =
        typeof meta.section === "string"
          ? SECTION_LABELS[meta.section] ?? meta.section
          : "profile details";
      items.push({
        id: `audit-${log.id}`,
        title: `Updated ${sec}`,
        category: "Profile",
        href: "/profile",
        timestamp: log.createdAt,
      });
    } else if (log.action === "resume_uploaded") {
      items.push({
        id: `audit-${log.id}`,
        title: "Uploaded a resume version",
        category: "Resume",
        href: "/resumes",
        timestamp: log.createdAt,
      });
    } else if (log.action === "resume_confirmed") {
      items.push({
        id: `audit-${log.id}`,
        title: "Confirmed parsed resume extraction",
        category: "Resume",
        href: "/resumes",
        timestamp: log.createdAt,
      });
    } else if (log.action === "tailored_document_created") {
      const company =
        typeof meta.company === "string" && meta.company
          ? ` for ${meta.company}`
          : "";
      items.push({
        id: `audit-${log.id}`,
        title: `Generated tailored document${company}`,
        category: "Tailoring",
        href: "/studio",
        timestamp: log.createdAt,
      });
    } else if (log.action === "screening_answer_generated") {
      items.push({
        id: `audit-${log.id}`,
        title: "Drafted screening question answer",
        category: "Tailoring",
        href: "/studio",
        timestamp: log.createdAt,
      });
    } else if (log.action === "application_created") {
      const matchedApp =
        typeof meta.applicationId === "string"
          ? applications?.find((a) => a.id === meta.applicationId)
          : undefined;
      const titleText =
        typeof meta.company === "string" && typeof meta.title === "string"
          ? `Tracked ${meta.title} at ${meta.company}`
          : matchedApp
            ? `Tracked ${matchedApp.title} at ${matchedApp.company}`
            : typeof meta.company === "string" && meta.company
              ? `Tracked application at ${meta.company}`
              : "Tracked new application";
      items.push({
        id: `audit-${log.id}`,
        title: titleText,
        category: "Application",
        href: "/applications",
        timestamp: log.createdAt,
      });
    }
  }

  for (const app of applications ?? []) {
    // Include application updates (status changes or edits newer than creation)
    const STATUS_DISPLAY: Record<string, string> = {
      saved: "Saved",
      preparing: "Preparing",
      ready_to_apply: "Ready to Apply",
      applied: "Applied",
      interviewing: "Interviewing",
      offer: "Offer received",
      rejected: "Rejected",
      withdrawn: "Withdrawn",
    };
    const statusText = STATUS_DISPLAY[app.status] ?? app.status;
    const updatedRecently =
      Math.abs(
        new Date(app.updatedAt).getTime() - new Date(app.createdAt).getTime()
      ) > 2000;
    if (updatedRecently || items.every((i) => !i.title.includes(app.company))) {
      items.push({
        id: `app-${app.id}-${app.status}`,
        title: `${app.title} at ${app.company}`,
        category: "Application",
        statusLabel: statusText,
        href: "/applications",
        timestamp: app.updatedAt,
      });
    }
  }

  for (const job of jobs ?? []) {
    if (job.userState === "saved") {
      items.push({
        id: `saved-job-${job.id}`,
        title: `Saved role: ${job.title} at ${job.company}`,
        category: "Job",
        statusLabel: `${job.match.score}% match`,
        href: `/jobs/${job.id}`,
        timestamp: job.postedAt ?? job.createdAt,
      });
    }
  }

  items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return items.slice(0, 6);
}

