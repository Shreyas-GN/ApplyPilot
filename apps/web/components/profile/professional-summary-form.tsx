"use client";

import { useState } from "react";
import type { ProfileDto } from "@/lib/types";
import { updateProfileSchema } from "@applypilot/validators";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { api, ApiError } from "@/lib/api-client";
import { SectionFrame, type ProvenanceKind } from "./profile-editorial-ui";

interface ProfessionalSummaryFormProps {
  profile: ProfileDto;
  onUpdated: (profile: ProfileDto) => void;
}

const CAREER_STAGE_OPTIONS = [
  { value: "", label: "Select career stage" },
  { value: "student", label: "Student / Recent Graduate" },
  { value: "early_career", label: "Early Career (0–2 yrs)" },
  { value: "mid_level", label: "Mid-Level Practitioner (3–5 yrs)" },
  { value: "senior", label: "Senior Individual Contributor (6–9 yrs)" },
  { value: "lead_staff", label: "Lead / Staff / Principal (10+ yrs)" },
  { value: "executive", label: "Engineering / Product Leadership" },
  { value: "career_switcher", label: "Career Switcher / Domain Transition" },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "", label: "Select availability" },
  { value: "actively_looking", label: "Actively interviewing" },
  { value: "open_to_offers", label: "Open to the right opportunity" },
  { value: "employed", label: "Employed, passively exploring" },
  { value: "not_looking", label: "Not actively looking" },
];

export function ProfessionalSummaryForm({
  profile,
  onUpdated,
}: ProfessionalSummaryFormProps) {
  const [form, setForm] = useState({
    headline: profile.headline ?? "",
    careerStage: profile.careerStage ?? "",
    yearsOfExperience: profile.yearsOfExperience?.toString() ?? "",
    employmentStatus: profile.employmentStatus ?? "",
    summary: profile.summary ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);

  const metaSource = profile.intelligenceMetadata?.summarySource;
  const hasAnyValue = Boolean(
    form.headline.trim() ||
      form.summary.trim() ||
      form.careerStage ||
      form.yearsOfExperience
  );
  const provenance: ProvenanceKind =
    metaSource === "ai" && hasAnyValue
      ? "ai_extracted"
      : hasAnyValue
        ? "user"
        : "empty";

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setSaved(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildPayload(confirm?: boolean) {
    return {
      headline: form.headline,
      careerStage: form.careerStage || null,
      yearsOfExperience:
        form.yearsOfExperience.trim() !== ""
          ? Number(form.yearsOfExperience)
          : null,
      employmentStatus: form.employmentStatus,
      summary: form.summary,
      ...(confirm ? { confirmSection: "professional_summary" as const } : {}),
    };
  }

  async function handleSave() {
    setSaved(false);
    setFormError(null);
    const result = updateProfileSchema.safeParse(buildPayload());
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[String(issue.path[0])] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const updated = await api.patch<ProfileDto>("/profile", result.data);
      onUpdated(updated);
      setSaved(true);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.detail : "Failed to save professional summary."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmAi() {
    setSaved(false);
    setFormError(null);
    const result = updateProfileSchema.safeParse(buildPayload(true));
    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? "Invalid summary fields.");
      return;
    }
    setConfirming(true);
    try {
      const updated = await api.patch<ProfileDto>("/profile", result.data);
      onUpdated(updated);
      setSaved(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.detail : "Failed to confirm summary.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <SectionFrame
      id="section-professional_summary"
      sectionNumber="02"
      eyebrow="Positioning"
      title="Professional Summary"
      description="Your editorial thesis: headline positioning, career stage, and verified narrative used across tailored resumes."
      provenance={provenance}
      saving={saving}
      saved={saved}
      error={formError}
      onSave={handleSave}
      saveLabel="Save summary"
      confirmAction={
        provenance === "ai_extracted"
          ? {
              label: "Confirm AI summary",
              onClick: handleConfirmAi,
              loading: confirming,
            }
          : undefined
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <TextField
            name="headline"
            label="Headline"
            placeholder="e.g. Senior Full-Stack Engineer specializing in TypeScript & distributed APIs"
            value={form.headline}
            onChange={(e) => setField("headline", e.target.value)}
            error={fieldErrors.headline}
          />
        </div>
        <SelectField
          name="careerStage"
          label="Career stage"
          value={form.careerStage}
          onChange={(e) => setField("careerStage", e.target.value)}
          error={fieldErrors.careerStage}
        >
          {CAREER_STAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </SelectField>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="yearsOfExperience"
            label="Years of experience"
            type="number"
            min={0}
            max={80}
            placeholder="e.g. 5"
            value={form.yearsOfExperience}
            onChange={(e) => setField("yearsOfExperience", e.target.value)}
            error={fieldErrors.yearsOfExperience}
          />
          <SelectField
            name="employmentStatus"
            label="Job search status"
            value={form.employmentStatus}
            onChange={(e) => setField("employmentStatus", e.target.value)}
            error={fieldErrors.employmentStatus}
          >
            {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="sm:col-span-2">
          <TextAreaField
            name="summary"
            label="Summary"
            rows={4}
            placeholder="Summarize your core strengths, scale of systems or teams you have shipped with, and what problems you solve best."
            value={form.summary}
            onChange={(e) => setField("summary", e.target.value)}
            error={fieldErrors.summary}
          />
        </div>
      </div>
    </SectionFrame>
  );
}

