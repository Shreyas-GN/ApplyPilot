"use client";

import type { ProfileDto } from "@/lib/types";
import {
  replaceWorkExperienceSchema,
  replaceEducationSchema,
  replaceProjectsSchema,
  replaceCertificationsSchema,
} from "@applypilot/validators";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { BasicInfoForm } from "@/components/profile/basic-info-form";
import { PreferencesForm } from "@/components/profile/preferences-form";
import { SkillsEditor } from "@/components/profile/skills-editor";
import { RepeatableSection, type ItemValues } from "@/components/profile/repeatable-section";
import { api } from "@/lib/api-client";
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

function ProfileContent() {
  const { data: profile, loading, error, refetch } = useApi<ProfileDto>("/profile");

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (error || !profile) {
    return <p className="text-sm text-red-600">Couldn&apos;t load your profile. Please refresh.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Your profile</h1>

      <BasicInfoForm profile={profile} />

      <RepeatableSection
        title="Work experience"
        emptyLabel="No work experience added yet."
        initialItems={profile.experience.map((e) => ({
          source: e.source,
          values: {
            company: e.company,
            title: e.title,
            location: e.location ?? "",
            startDate: e.startDate ?? "",
            endDate: e.endDate ?? "",
            isCurrent: e.isCurrent,
            description: e.description ?? "",
          },
        }))}
        fields={[
          { name: "company", label: "Company", type: "text" },
          { name: "title", label: "Title", type: "text" },
          { name: "location", label: "Location", type: "text" },
          { name: "startDate", label: "Start date", type: "text", placeholder: "YYYY-MM" },
          { name: "endDate", label: "End date", type: "text", placeholder: "YYYY-MM" },
          { name: "isCurrent", label: "I currently work here", type: "checkbox" },
          { name: "description", label: "Description", type: "textarea" },
        ]}
        onSave={async (items: ItemValues[]) => {
          const parsed = replaceWorkExperienceSchema.parse({ items });
          await api.put("/profile/experience", parsed);
          refetch();
        }}
      />

      <RepeatableSection
        title="Education"
        emptyLabel="No education added yet."
        initialItems={profile.education.map((e) => ({
          source: e.source,
          values: {
            institution: e.institution,
            degree: e.degree ?? "",
            fieldOfStudy: e.fieldOfStudy ?? "",
            startDate: e.startDate ?? "",
            endDate: e.endDate ?? "",
            description: e.description ?? "",
          },
        }))}
        fields={[
          { name: "institution", label: "Institution", type: "text" },
          { name: "degree", label: "Degree", type: "text" },
          { name: "fieldOfStudy", label: "Field of study", type: "text" },
          { name: "startDate", label: "Start date", type: "text", placeholder: "YYYY-MM" },
          { name: "endDate", label: "End date", type: "text", placeholder: "YYYY-MM" },
          { name: "description", label: "Description", type: "textarea" },
        ]}
        onSave={async (items: ItemValues[]) => {
          const parsed = replaceEducationSchema.parse({ items });
          await api.put("/profile/education", parsed);
          refetch();
        }}
      />

      <SkillsEditor skills={profile.skills} />

      <RepeatableSection
        title="Projects"
        emptyLabel="No projects added yet."
        initialItems={profile.projects.map((p) => ({
          source: p.source,
          values: {
            name: p.name,
            description: p.description ?? "",
            url: p.url ?? "",
            startDate: p.startDate ?? "",
            endDate: p.endDate ?? "",
          },
        }))}
        fields={[
          { name: "name", label: "Project name", type: "text" },
          { name: "url", label: "URL", type: "text" },
          { name: "startDate", label: "Start date", type: "text", placeholder: "YYYY-MM" },
          { name: "endDate", label: "End date", type: "text", placeholder: "YYYY-MM" },
          { name: "description", label: "Description", type: "textarea" },
        ]}
        onSave={async (items: ItemValues[]) => {
          const parsed = replaceProjectsSchema.parse({ items });
          await api.put("/profile/projects", parsed);
          refetch();
        }}
      />

      <RepeatableSection
        title="Certifications"
        emptyLabel="No certifications added yet."
        initialItems={profile.certifications.map((c) => ({
          source: c.source,
          values: {
            name: c.name,
            issuer: c.issuer ?? "",
            issueDate: c.issueDate ?? "",
            expiryDate: c.expiryDate ?? "",
            credentialUrl: c.credentialUrl ?? "",
          },
        }))}
        fields={[
          { name: "name", label: "Certification name", type: "text" },
          { name: "issuer", label: "Issuer", type: "text" },
          { name: "issueDate", label: "Issue date", type: "text", placeholder: "YYYY-MM" },
          { name: "expiryDate", label: "Expiry date", type: "text", placeholder: "YYYY-MM" },
          { name: "credentialUrl", label: "Credential URL", type: "text" },
        ]}
        onSave={async (items: ItemValues[]) => {
          const parsed = replaceCertificationsSchema.parse({ items });
          await api.put("/profile/certifications", parsed);
          refetch();
        }}
      />

      <PreferencesForm profile={profile} />
    </div>
  );
}
