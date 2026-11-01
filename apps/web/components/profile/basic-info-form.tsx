"use client";

import { useState } from "react";
import type { ProfileDto } from "@applypilot/shared";
import { updateProfileSchema, type UpdateProfileInput } from "@applypilot/validators";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { api, ApiError } from "@/lib/api-client";

export function BasicInfoForm({ profile }: { profile: ProfileDto }) {
  const [form, setForm] = useState({
    fullName: profile.fullName ?? "",
    phone: profile.phone ?? "",
    location: profile.location ?? "",
    linkedinUrl: profile.linkedinUrl ?? "",
    githubUrl: profile.githubUrl ?? "",
    portfolioUrl: profile.portfolioUrl ?? "",
    headline: profile.headline ?? "",
    summary: profile.summary ?? "",
    yearsOfExperience: profile.yearsOfExperience?.toString() ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaved(false);
    setFormError(null);
    const payload: Partial<UpdateProfileInput> = {
      ...form,
      yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
    };
    const result = updateProfileSchema.safeParse(payload);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) errors[String(issue.path[0])] = issue.message;
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      await api.patch("/profile", result.data);
      setSaved(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.detail : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Personal & professional info"
        action={<Button onClick={handleSave} loading={saving}>Save</Button>}
      />
      {formError && (
        <div className="mb-4">
          <Alert tone="error">{formError}</Alert>
        </div>
      )}
      {saved && !formError && (
        <div className="mb-4">
          <Alert tone="success">Saved.</Alert>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="fullName" label="Full name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} error={fieldErrors.fullName} />
        <TextField name="phone" label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} error={fieldErrors.phone} />
        <TextField name="location" label="Location" value={form.location} onChange={(e) => set("location", e.target.value)} error={fieldErrors.location} />
        <TextField
          name="yearsOfExperience"
          label="Years of experience"
          type="number"
          min={0}
          value={form.yearsOfExperience}
          onChange={(e) => set("yearsOfExperience", e.target.value)}
          error={fieldErrors.yearsOfExperience}
        />
        <TextField name="linkedinUrl" label="LinkedIn URL" value={form.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} error={fieldErrors.linkedinUrl} />
        <TextField name="githubUrl" label="GitHub URL" value={form.githubUrl} onChange={(e) => set("githubUrl", e.target.value)} error={fieldErrors.githubUrl} />
        <TextField name="portfolioUrl" label="Portfolio URL" value={form.portfolioUrl} onChange={(e) => set("portfolioUrl", e.target.value)} error={fieldErrors.portfolioUrl} />
        <TextField name="headline" label="Headline" value={form.headline} onChange={(e) => set("headline", e.target.value)} error={fieldErrors.headline} />
        <div className="sm:col-span-2">
          <TextAreaField
            name="summary"
            label="Summary"
            rows={4}
            value={form.summary}
            onChange={(e) => set("summary", e.target.value)}
            error={fieldErrors.summary}
          />
        </div>
      </div>
    </Card>
  );
}
