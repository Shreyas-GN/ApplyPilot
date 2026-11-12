"use client";

import { useState } from "react";
import type { ProfileDto } from "@/lib/types";
import {
  replaceWorkExperienceSchema,
  replaceEducationSchema,
  replaceProjectsSchema,
  replaceCertificationsSchema,
} from "@applypilot/validators";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileIntelligenceOverview } from "@/components/profile/profile-intelligence-overview";
import { PersonalInfoForm } from "@/components/profile/personal-info-form";
import { ProfessionalSummaryForm } from "@/components/profile/professional-summary-form";
import { SkillsEditor } from "@/components/profile/skills-editor";
import {
  RepeatableSection,
  type RepeatableSaveEntry,
} from "@/components/profile/repeatable-section";
import { PreferencesForm } from "@/components/profile/preferences-form";
import { CareerInterestsForm } from "@/components/profile/career-interests-form";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ProfileContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((v) => String(v).trim()).filter(Boolean)
    : [];
}

function parseOrThrow<T>(
  schema: {
    safeParse: (input: unknown) =>
      | { success: true; data: T }
      | { success: false; error: { issues: { message: string }[] } };
  },
  input: unknown
): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Please review the fields and try again."
    );
  }
  return parsed.data;
}

function ProfileContent() {
  const { data: fetchedProfile, loading, refreshing, error, refetch } =
    useApi<ProfileDto>("/profile");
  const [liveProfile, setLiveProfile] = useState<ProfileDto | null>(null);

  const profile = liveProfile ?? fetchedProfile;

  function handleUpdated(next: ProfileDto) {
    setLiveProfile(next);
  }

  function scrollToSection(sectionId: string) {
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (loading && !profile) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-[14px] border border-ui-border bg-ui-linen"
          />
        ))}
      </div>
    );
  }

  if ((error && !profile) || !profile) {
    return (
      <div className="mx-auto max-w-3xl rounded-[14px] border border-red-200 bg-red-50 p-6 text-sm text-red-900">
        <p className="font-display text-xl">Couldn&apos;t load your profile</p>
        <p className="mt-1 text-xs text-red-700">
          {error ?? "Please check your session or network connection and try again."}
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full bg-red-700 px-4 py-2 text-xs font-medium text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const sections = profile.intelligence?.sections ?? [];

  async function saveExperience(entries: RepeatableSaveEntry[]) {
    const payload = parseOrThrow(replaceWorkExperienceSchema, {
      items: entries.map(({ values: v, source, confidence }) => ({
        company: String(v.company ?? ""),
        title: String(v.title ?? ""),
        location: String(v.location ?? "") || undefined,
        startDate: String(v.startDate ?? "") || undefined,
        endDate: Boolean(v.isCurrent)
          ? undefined
          : String(v.endDate ?? "") || undefined,
        isCurrent: Boolean(v.isCurrent),
        responsibilities: asStringList(v.responsibilities),
        achievements: asStringList(v.achievements),
        technologies: asStringList(v.technologies),
        description: String(v.description ?? "") || undefined,
        source,
        confidence,
      })),
    });
    try {
      const updated = await api.put<ProfileDto>("/profile/experience", payload);
      handleUpdated(updated);
    } catch (err) {
      throw new Error(
        err instanceof ApiError ? err.detail : "Failed to save work experience."
      );
    }
  }

  async function saveEducation(entries: RepeatableSaveEntry[]) {
    const payload = parseOrThrow(replaceEducationSchema, {
      items: entries.map(({ values: v, source, confidence }) => {
        const gradStr = String(v.graduationYear ?? "").trim();
        const parsedGrad = gradStr !== "" ? Number(gradStr) : null;
        return {
          institution: String(v.institution ?? ""),
          degree: String(v.degree ?? "") || undefined,
          fieldOfStudy: String(v.fieldOfStudy ?? "") || undefined,
          graduationYear:
            parsedGrad !== null && !Number.isNaN(parsedGrad) ? parsedGrad : null,
          grade: String(v.grade ?? "") || undefined,
          startDate: String(v.startDate ?? "") || undefined,
          endDate: String(v.endDate ?? "") || undefined,
          description: String(v.description ?? "") || undefined,
          source,
          confidence,
        };
      }),
    });
    try {
      const updated = await api.put<ProfileDto>("/profile/education", payload);
      handleUpdated(updated);
    } catch (err) {
      throw new Error(
        err instanceof ApiError ? err.detail : "Failed to save education."
      );
    }
  }

  async function saveProjects(entries: RepeatableSaveEntry[]) {
    const payload = parseOrThrow(replaceProjectsSchema, {
      items: entries.map(({ values: v, source, confidence }) => ({
        name: String(v.name ?? ""),
        role: String(v.role ?? "") || undefined,
        description: String(v.description ?? "") || undefined,
        technologies: asStringList(v.technologies),
        contributions: asStringList(v.contributions),
        githubUrl: String(v.githubUrl ?? "") || undefined,
        liveUrl: String(v.liveUrl ?? "") || undefined,
        startDate: String(v.startDate ?? "") || undefined,
        endDate: String(v.endDate ?? "") || undefined,
        source,
        confidence,
      })),
    });
    try {
      const updated = await api.put<ProfileDto>("/profile/projects", payload);
      handleUpdated(updated);
    } catch (err) {
      throw new Error(
        err instanceof ApiError ? err.detail : "Failed to save projects."
      );
    }
  }

  async function saveCertifications(entries: RepeatableSaveEntry[]) {
    const payload = parseOrThrow(replaceCertificationsSchema, {
      items: entries.map(({ values: v, source, confidence }) => ({
        name: String(v.name ?? ""),
        issuer: String(v.issuer ?? "") || undefined,
        issueDate: String(v.issueDate ?? "") || undefined,
        expiryDate: String(v.expiryDate ?? "") || undefined,
        credentialUrl: String(v.credentialUrl ?? "") || undefined,
        source,
        confidence,
      })),
    });
    try {
      const updated = await api.put<ProfileDto>(
        "/profile/certifications",
        payload
      );
      handleUpdated(updated);
    } catch (err) {
      throw new Error(
        err instanceof ApiError ? err.detail : "Failed to save certifications."
      );
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <ProfileIntelligenceOverview profile={profile} refreshing={refreshing} />

      {/* Mobile section quick jump strip */}
      {sections.length > 0 && (
        <nav
          aria-label="Profile sections"
          className="flex gap-1.5 overflow-x-auto pb-1 lg:hidden"
        >
          {sections.map((section, idx) => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                section.complete
                  ? "border-ap-sage/30 bg-emerald-50 text-emerald-700"
                  : section.aiUnverifiedCount > 0
                    ? "border-amber-300 bg-ap-butter text-ui-ink"
                    : "border-ui-border bg-ui-surface text-ui-body"
              }`}
            >
              0{idx + 1} · {section.label}
            </button>
          ))}
        </nav>
      )}

      <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start">
        {/* Desktop Field Guide index */}
        <aside className="hidden lg:sticky lg:top-6 lg:block">
          <div className="rounded-[14px] border border-ui-border bg-ui-surface p-4 shadow-[0_1px_2px_rgba(30,25,21,0.04)]">
            <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ui-muted">
              Dossier Index
            </p>
            <nav aria-label="Dossier sections" className="space-y-1">
              {sections.map((section, idx) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-ui-body transition hover:bg-ui-linen hover:text-ui-ink"
                >
                  <span className="truncate">
                    <span className="mr-1.5 font-mono text-[11px] text-ui-muted">
                      0{idx + 1}
                    </span>
                    {section.label}
                  </span>
                  {section.complete ? (
                    <span className="shrink-0 font-mono text-[11px] text-emerald-700">
                      ✓
                    </span>
                  ) : section.aiUnverifiedCount > 0 ? (
                    <span className="shrink-0 rounded-full bg-ap-butter px-1.5 py-0.5 font-mono text-[10px] text-ui-ink">
                      AI
                    </span>
                  ) : (
                    <span className="shrink-0 font-mono text-[10px] text-ui-muted">
                      —
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main 9-section editorial stack */}
        <div className="min-w-0 space-y-6">
          {/* 01. Personal Information */}
          <PersonalInfoForm profile={profile} onUpdated={handleUpdated} />

          {/* 02. Professional Summary */}
          <ProfessionalSummaryForm profile={profile} onUpdated={handleUpdated} />

          {/* 03. Skills & Technologies */}
          <SkillsEditor skills={profile.skills} onUpdated={handleUpdated} />

          {/* 04. Work Experience */}
          <RepeatableSection
            id="section-experience"
            sectionNumber="04"
            eyebrow="Career History"
            title="Work Experience"
            description="Document companies, roles, dates, responsibilities, measurable achievements, and technologies used."
            emptyLabel="No work experience entries yet."
            addLabel="+ Add role"
            itemTitleKey="title"
            itemSubtitleKey="company"
            fields={[
              { name: "company", label: "Company", type: "text", placeholder: "e.g. Stripe" },
              { name: "title", label: "Role / Title", type: "text", placeholder: "e.g. Senior Software Engineer" },
              { name: "location", label: "Location", type: "text", placeholder: "Remote / City" },
              { name: "startDate", label: "Start date", type: "text", placeholder: "YYYY-MM", hint: "YYYY or YYYY-MM" },
              { name: "endDate", label: "End date", type: "text", placeholder: "YYYY-MM", hint: "Leave blank if current" },
              { name: "isCurrent", label: "I currently work here", type: "checkbox" },
              {
                name: "responsibilities",
                label: "Key responsibilities",
                type: "bullets",
                placeholder: "Add a core responsibility and press Enter",
              },
              {
                name: "achievements",
                label: "Measurable achievements",
                type: "bullets",
                placeholder: "e.g. Reduced p95 checkout latency by 38% across 12M req/day",
              },
              {
                name: "technologies",
                label: "Technologies used",
                type: "tags",
                placeholder: "TypeScript, PostgreSQL, Redis",
              },
              {
                name: "description",
                label: "Summary / narrative notes (optional)",
                type: "textarea",
                placeholder: "Optional role context used alongside structured bullets",
              },
            ]}
            initialItems={profile.experience.map((e) => ({
              values: {
                company: e.company,
                title: e.title,
                location: e.location ?? "",
                startDate: e.startDate ?? "",
                endDate: e.endDate ?? "",
                isCurrent: e.isCurrent,
                responsibilities: e.responsibilities ?? [],
                achievements: e.achievements ?? [],
                technologies: e.technologies ?? [],
                description: e.description ?? "",
              },
              source: e.source,
              confidence: e.confidence,
            }))}
            onSave={saveExperience}
          />

          {/* 05. Education */}
          <RepeatableSection
            id="section-education"
            sectionNumber="05"
            eyebrow="Academic Background"
            title="Education"
            description="Record institutions, degrees, specializations, graduation years, and academic honors or grades."
            emptyLabel="No education entries yet."
            addLabel="+ Add education"
            itemTitleKey="institution"
            itemSubtitleKey="degree"
            fields={[
              { name: "institution", label: "Institution", type: "text", placeholder: "e.g. IIT Bombay" },
              { name: "degree", label: "Degree", type: "text", placeholder: "e.g. B.Tech / MS / BSc" },
              { name: "fieldOfStudy", label: "Specialization / Major", type: "text", placeholder: "e.g. Computer Science" },
              { name: "graduationYear", label: "Graduation year", type: "number", placeholder: "e.g. 2022" },
              { name: "grade", label: "Grade / GPA", type: "text", placeholder: "e.g. 9.1 / 10 or 3.8 GPA" },
              { name: "startDate", label: "Start date", type: "text", placeholder: "YYYY-MM" },
              { name: "endDate", label: "End date", type: "text", placeholder: "YYYY-MM" },
              { name: "description", label: "Relevant coursework & honors", type: "textarea" },
            ]}
            initialItems={profile.education.map((ed) => ({
              values: {
                institution: ed.institution,
                degree: ed.degree ?? "",
                fieldOfStudy: ed.fieldOfStudy ?? "",
                graduationYear:
                  ed.graduationYear !== null && ed.graduationYear !== undefined
                    ? String(ed.graduationYear)
                    : "",
                grade: ed.grade ?? "",
                startDate: ed.startDate ?? "",
                endDate: ed.endDate ?? "",
                description: ed.description ?? "",
              },
              source: ed.source,
              confidence: ed.confidence,
            }))}
            onSave={saveEducation}
          />

          {/* 06. Projects */}
          <RepeatableSection
            id="section-projects"
            sectionNumber="06"
            eyebrow="Proof of Work"
            title="Projects"
            description="Showcase shipped products, architecture, technical stack, concrete contributions, and public repositories or live demos."
            emptyLabel="No projects added yet."
            addLabel="+ Add project"
            itemTitleKey="name"
            itemSubtitleKey="role"
            fields={[
              { name: "name", label: "Project name", type: "text", placeholder: "e.g. Distributed Task Scheduler" },
              { name: "role", label: "Your role", type: "text", placeholder: "e.g. Sole Author / Tech Lead" },
              { name: "description", label: "Description", type: "textarea", placeholder: "What problem it solves and how it works" },
              { name: "technologies", label: "Technologies", type: "tags", placeholder: "Next.js, Drizzle, Postgres, Go" },
              { name: "contributions", label: "Key contributions", type: "bullets", placeholder: "Add a specific engineering contribution" },
              { name: "githubUrl", label: "GitHub URL", type: "url", placeholder: "https://github.com/..." },
              { name: "liveUrl", label: "Live demo URL", type: "url", placeholder: "https://..." },
              { name: "startDate", label: "Start date", type: "text", placeholder: "YYYY-MM" },
              { name: "endDate", label: "End date", type: "text", placeholder: "YYYY-MM" },
            ]}
            initialItems={profile.projects.map((p) => ({
              values: {
                name: p.name,
                role: p.role ?? "",
                description: p.description ?? "",
                technologies: p.technologies ?? [],
                contributions: p.contributions ?? [],
                githubUrl: p.githubUrl ?? "",
                liveUrl: p.liveUrl ?? p.url ?? "",
                startDate: p.startDate ?? "",
                endDate: p.endDate ?? "",
              },
              source: p.source,
              confidence: p.confidence,
            }))}
            onSave={saveProjects}
          />

          {/* 07. Certifications */}
          <RepeatableSection
            id="section-certifications"
            sectionNumber="07"
            eyebrow="Verified Credentials"
            title="Certifications"
            description="Track cloud, security, domain, and professional credentials with verification URLs."
            emptyLabel="No certifications recorded yet."
            addLabel="+ Add certification"
            itemTitleKey="name"
            itemSubtitleKey="issuer"
            fields={[
              { name: "name", label: "Certification name", type: "text", placeholder: "e.g. AWS Solutions Architect – Associate" },
              { name: "issuer", label: "Issuer", type: "text", placeholder: "e.g. Amazon Web Services" },
              { name: "issueDate", label: "Issue date", type: "text", placeholder: "YYYY-MM" },
              { name: "expiryDate", label: "Expiry date", type: "text", placeholder: "YYYY-MM (optional)" },
              { name: "credentialUrl", label: "Credential verification URL", type: "url", placeholder: "https://...", fullWidth: true },
            ]}
            initialItems={profile.certifications.map((c) => ({
              values: {
                name: c.name,
                issuer: c.issuer ?? "",
                issueDate: c.issueDate ?? "",
                expiryDate: c.expiryDate ?? "",
                credentialUrl: c.credentialUrl ?? "",
              },
              source: c.source,
              confidence: c.confidence,
            }))}
            onSave={saveCertifications}
          />

          {/* 08. Career Preferences */}
          <PreferencesForm profile={profile} onUpdated={handleUpdated} />

          {/* 09. Career Interests */}
          <CareerInterestsForm profile={profile} onUpdated={handleUpdated} />
        </div>
      </div>
    </div>
  );
}
