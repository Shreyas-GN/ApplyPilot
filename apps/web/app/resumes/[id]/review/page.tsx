"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ResumeDto, ResumeParsedDataDto } from "@/lib/types";
import { resumeParsedDataSchema } from "@applypilot/validators";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import {
  ControlledEntryList,
  type ControlledEntry,
} from "@/components/profile/controlled-entry-list";
import { api, ApiError } from "@/lib/api-client";

type PersonalForm = Record<string, string>;

export default function ResumeReviewPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ReviewContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function ReviewContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [resume, setResume] = useState<ResumeDto | null>(null);
  const [personal, setPersonal] = useState<PersonalForm>({});
  const [experience, setExperience] = useState<ControlledEntry[]>([]);
  const [education, setEducation] = useState<ControlledEntry[]>([]);
  const [skills, setSkills] = useState<ControlledEntry[]>([]);
  const [projects, setProjects] = useState<ControlledEntry[]>([]);
  const [certifications, setCertifications] = useState<ControlledEntry[]>([]);
  const [overallConfidence, setOverallConfidence] = useState<number | undefined>();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [resumeData, parsed] = await Promise.all([
          api.get<ResumeDto>(`/resumes/${id}`),
          api.get<ResumeParsedDataDto>(`/resumes/${id}/parsed-data`),
        ]);
        if (cancelled) return;
        setResume(resumeData);
        setPersonal({
          fullName: parsed.personal.fullName ?? "",
          email: parsed.personal.email ?? "",
          phone: parsed.personal.phone ?? "",
          location: parsed.personal.location ?? "",
          linkedinUrl: parsed.personal.linkedinUrl ?? "",
          githubUrl: parsed.personal.githubUrl ?? "",
          portfolioUrl: parsed.personal.portfolioUrl ?? "",
          headline: parsed.personal.headline ?? "",
          summary: parsed.personal.summary ?? "",
        });
        setExperience(
          parsed.experience.map((e) => ({
            source: e.source,
            confidence: e.confidence,
            values: {
              company: e.company,
              title: e.title,
              location: e.location ?? "",
              startDate: e.startDate ?? "",
              endDate: e.endDate ?? "",
              isCurrent: e.isCurrent ?? false,
              description: e.description ?? "",
            },
          })),
        );
        setEducation(
          parsed.education.map((e) => ({
            source: e.source,
            confidence: e.confidence,
            values: {
              institution: e.institution,
              degree: e.degree ?? "",
              fieldOfStudy: e.fieldOfStudy ?? "",
              startDate: e.startDate ?? "",
              endDate: e.endDate ?? "",
              description: e.description ?? "",
            },
          })),
        );
        setSkills(
          parsed.skills.map((s) => ({
            source: s.source,
            confidence: s.confidence,
            values: { name: s.name, category: s.category ?? "" },
          })),
        );
        setProjects(
          parsed.projects.map((p) => ({
            source: p.source,
            confidence: p.confidence,
            values: {
              name: p.name,
              description: p.description ?? "",
              url: p.url ?? "",
              startDate: p.startDate ?? "",
              endDate: p.endDate ?? "",
            },
          })),
        );
        setCertifications(
          parsed.certifications.map((c) => ({
            source: c.source,
            confidence: c.confidence,
            values: {
              name: c.name,
              issuer: c.issuer ?? "",
              issueDate: c.issueDate ?? "",
              expiryDate: c.expiryDate ?? "",
              credentialUrl: c.credentialUrl ?? "",
            },
          })),
        );
        setOverallConfidence(parsed.overallConfidence);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.detail : "Couldn't load this resume's parsed data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function buildPayload() {
    return resumeParsedDataSchema.parse({
      personal: Object.fromEntries(Object.entries(personal).filter(([, v]) => v !== "")),
      experience: experience.map((e) => ({
        company: e.values.company,
        title: e.values.title,
        location: e.values.location || undefined,
        startDate: e.values.startDate || undefined,
        endDate: e.values.endDate || undefined,
        isCurrent: Boolean(e.values.isCurrent),
        description: e.values.description || undefined,
        confidence: e.confidence ?? 1,
        source: e.source,
      })),
      education: education.map((e) => ({
        institution: e.values.institution,
        degree: e.values.degree || undefined,
        fieldOfStudy: e.values.fieldOfStudy || undefined,
        startDate: e.values.startDate || undefined,
        endDate: e.values.endDate || undefined,
        description: e.values.description || undefined,
        confidence: e.confidence ?? 1,
        source: e.source,
      })),
      skills: skills.map((s) => ({
        name: s.values.name,
        category: s.values.category || undefined,
        confidence: s.confidence ?? 1,
        source: s.source,
      })),
      projects: projects.map((p) => ({
        name: p.values.name,
        description: p.values.description || undefined,
        url: p.values.url || undefined,
        startDate: p.values.startDate || undefined,
        endDate: p.values.endDate || undefined,
        confidence: p.confidence ?? 1,
        source: p.source,
      })),
      certifications: certifications.map((c) => ({
        name: c.values.name,
        issuer: c.values.issuer || undefined,
        issueDate: c.values.issueDate || undefined,
        expiryDate: c.values.expiryDate || undefined,
        credentialUrl: c.values.credentialUrl || undefined,
        confidence: c.confidence ?? 1,
        source: c.source,
      })),
      overallConfidence,
    });
  }

  async function handleSaveCorrections() {
    setSaveError(null);
    setSaved(false);
    setSaving(true);
    try {
      const payload = buildPayload();
      await api.patch(`/resumes/${id}/parsed-data`, payload);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.detail : "Failed to save your corrections.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    setSaveError(null);
    setConfirming(true);
    try {
      const payload = buildPayload();
      await api.patch(`/resumes/${id}/parsed-data`, payload);
      await api.post(`/resumes/${id}/confirm`);
      router.push("/profile");
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.detail : "Failed to confirm this resume.");
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-ui-linen" />;
  }

  if (loadError) {
    return <Alert tone="error">{loadError}</Alert>;
  }

  const alreadyConfirmed = resume?.reviewStatus === "confirmed";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ui-ink">Review parsed resume</h1>
        <p className="mt-1 text-sm text-ui-muted">
          {resume?.versionLabel} — check what we extracted, correct anything that&apos;s wrong, then
          confirm to update your profile.
        </p>
      </div>

      {alreadyConfirmed && (
        <Alert tone="success">
          This resume&apos;s data has already been confirmed and applied to your profile. You can still
          edit it below and re-confirm.
        </Alert>
      )}
      {saveError && <Alert tone="error">{saveError}</Alert>}
      {saved && !saveError && <Alert tone="success">Corrections saved.</Alert>}

      <Card>
        <CardHeader title="Personal information" />
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["fullName", "Full name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["location", "Location"],
              ["linkedinUrl", "LinkedIn URL"],
              ["githubUrl", "GitHub URL"],
              ["portfolioUrl", "Portfolio URL"],
              ["headline", "Headline"],
            ] as const
          ).map(([key, label]) => (
            <TextField
              key={key}
              name={key}
              label={label}
              value={personal[key] ?? ""}
              onChange={(e) => setPersonal((prev) => ({ ...prev, [key]: e.target.value }))}
            />
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Work experience" />
        <ControlledEntryList
          items={experience}
          onChange={setExperience}
          emptyLabel="Nothing extracted — add experience manually if you'd like."
          blankValues={{ company: "", title: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "" }}
          fields={[
            { name: "company", label: "Company", type: "text" },
            { name: "title", label: "Title", type: "text" },
            { name: "location", label: "Location", type: "text" },
            { name: "startDate", label: "Start date", type: "text", placeholder: "YYYY-MM" },
            { name: "endDate", label: "End date", type: "text", placeholder: "YYYY-MM" },
            { name: "isCurrent", label: "Currently work here", type: "checkbox" },
            { name: "description", label: "Description", type: "textarea" },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Education" />
        <ControlledEntryList
          items={education}
          onChange={setEducation}
          emptyLabel="Nothing extracted — add education manually if you'd like."
          blankValues={{ institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", description: "" }}
          fields={[
            { name: "institution", label: "Institution", type: "text" },
            { name: "degree", label: "Degree", type: "text" },
            { name: "fieldOfStudy", label: "Field of study", type: "text" },
            { name: "startDate", label: "Start date", type: "text", placeholder: "YYYY-MM" },
            { name: "endDate", label: "End date", type: "text", placeholder: "YYYY-MM" },
            { name: "description", label: "Description", type: "textarea" },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Skills" />
        <ControlledEntryList
          items={skills}
          onChange={setSkills}
          emptyLabel="No skills extracted."
          blankValues={{ name: "", category: "" }}
          fields={[
            { name: "name", label: "Skill", type: "text" },
            { name: "category", label: "Category", type: "text" },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Projects" />
        <ControlledEntryList
          items={projects}
          onChange={setProjects}
          emptyLabel="Nothing extracted."
          blankValues={{ name: "", description: "", url: "", startDate: "", endDate: "" }}
          fields={[
            { name: "name", label: "Project name", type: "text" },
            { name: "url", label: "URL", type: "text" },
            { name: "startDate", label: "Start date", type: "text", placeholder: "YYYY-MM" },
            { name: "endDate", label: "End date", type: "text", placeholder: "YYYY-MM" },
            { name: "description", label: "Description", type: "textarea" },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Certifications" />
        <ControlledEntryList
          items={certifications}
          onChange={setCertifications}
          emptyLabel="Nothing extracted."
          blankValues={{ name: "", issuer: "", issueDate: "", expiryDate: "", credentialUrl: "" }}
          fields={[
            { name: "name", label: "Certification name", type: "text" },
            { name: "issuer", label: "Issuer", type: "text" },
            { name: "issueDate", label: "Issue date", type: "text", placeholder: "YYYY-MM" },
            { name: "expiryDate", label: "Expiry date", type: "text", placeholder: "YYYY-MM" },
            { name: "credentialUrl", label: "Credential URL", type: "text" },
          ]}
        />
      </Card>

      <div className="flex justify-end gap-3 rounded-xl border border-ui-border bg-white p-4 shadow-lg">
        <Button variant="secondary" onClick={handleSaveCorrections} loading={saving}>
          Save corrections
        </Button>
        <Button onClick={handleConfirm} loading={confirming}>
          Confirm and update my profile
        </Button>
      </div>
    </div>
  );
}
