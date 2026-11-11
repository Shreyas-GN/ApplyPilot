"use client";

import { useState } from "react";
import type { ProfileDto } from "@/lib/types";
import { updateProfileSchema } from "@applypilot/validators";
import { TextField } from "@/components/ui/field";
import { api, ApiError } from "@/lib/api-client";
import { SectionFrame, type ProvenanceKind } from "./profile-editorial-ui";

interface PersonalInfoFormProps {
  profile: ProfileDto;
  onUpdated: (profile: ProfileDto) => void;
}

export function PersonalInfoForm({ profile, onUpdated }: PersonalInfoFormProps) {
  const [form, setForm] = useState({
    fullName: profile.fullName ?? "",
    contactEmail: profile.email ?? profile.authEmail ?? "",
    phone: profile.phone ?? "",
    location: profile.location ?? "",
    linkedinUrl: profile.linkedinUrl ?? "",
    githubUrl: profile.githubUrl ?? "",
    portfolioUrl: profile.portfolioUrl ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);

  const metaSource = profile.intelligenceMetadata?.personalInfoSource;
  const hasAnyValue = Boolean(
    form.fullName.trim() ||
      form.phone.trim() ||
      form.location.trim() ||
      form.linkedinUrl.trim() ||
      form.githubUrl.trim() ||
      form.portfolioUrl.trim()
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

  async function handleSave() {
    setSaved(false);
    setFormError(null);
    const result = updateProfileSchema.safeParse(form);
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
      setFormError(err instanceof ApiError ? err.detail : "Failed to save personal info.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmAi() {
    setSaved(false);
    setFormError(null);
    setConfirming(true);
    try {
      const updated = await api.patch<ProfileDto>("/profile", {
        ...form,
        confirmSection: "personal_info",
      });
      onUpdated(updated);
      setSaved(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.detail : "Failed to confirm details.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <SectionFrame
      id="section-personal_info"
      sectionNumber="01"
      eyebrow="Identity & Contact"
      title="Personal Information"
      description="Canonical contact identity used for autofill, resume headers, and recruiter correspondence."
      provenance={provenance}
      saving={saving}
      saved={saved}
      error={formError}
      onSave={handleSave}
      saveLabel="Save identity"
      confirmAction={
        provenance === "ai_extracted"
          ? {
              label: "Confirm AI details",
              onClick: handleConfirmAi,
              loading: confirming,
            }
          : undefined
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="fullName"
          label="Full name"
          placeholder="e.g. Priya Nair"
          value={form.fullName}
          onChange={(e) => setField("fullName", e.target.value)}
          error={fieldErrors.fullName}
        />
        <TextField
          name="contactEmail"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          hint={profile.authEmail ? `Account sign-in: ${profile.authEmail}` : undefined}
          value={form.contactEmail}
          onChange={(e) => setField("contactEmail", e.target.value)}
          error={fieldErrors.contactEmail}
        />
        <TextField
          name="phone"
          label="Phone"
          placeholder="+1 (555) 234-5678"
          value={form.phone}
          onChange={(e) => setField("phone", e.target.value)}
          error={fieldErrors.phone}
        />
        <TextField
          name="location"
          label="Location"
          placeholder="e.g. Bengaluru, India · Remote-ready"
          value={form.location}
          onChange={(e) => setField("location", e.target.value)}
          error={fieldErrors.location}
        />
        <TextField
          name="linkedinUrl"
          label="LinkedIn URL"
          placeholder="https://linkedin.com/in/your-handle"
          value={form.linkedinUrl}
          onChange={(e) => setField("linkedinUrl", e.target.value)}
          error={fieldErrors.linkedinUrl}
        />
        <TextField
          name="githubUrl"
          label="GitHub URL"
          placeholder="https://github.com/your-handle"
          value={form.githubUrl}
          onChange={(e) => setField("githubUrl", e.target.value)}
          error={fieldErrors.githubUrl}
        />
        <div className="sm:col-span-2">
          <TextField
            name="portfolioUrl"
            label="Portfolio / Website URL"
            placeholder="https://yourportfolio.dev"
            value={form.portfolioUrl}
            onChange={(e) => setField("portfolioUrl", e.target.value)}
            error={fieldErrors.portfolioUrl}
          />
        </div>
      </div>
    </SectionFrame>
  );
}

