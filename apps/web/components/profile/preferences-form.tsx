"use client";

import { useState } from "react";
import type { ProfileDto } from "@applypilot/shared";
import { updatePreferencesSchema } from "@applypilot/validators";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField, SelectField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { api, ApiError } from "@/lib/api-client";

function toCsv(items: string[]): string {
  return items.join(", ");
}

function fromCsv(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function PreferencesForm({ profile }: { profile: ProfileDto }) {
  const [preferredTitles, setPreferredTitles] = useState(toCsv(profile.preferredTitles));
  const [preferredLocations, setPreferredLocations] = useState(toCsv(profile.preferredLocations));
  const [workMode, setWorkMode] = useState(profile.workMode ?? "");
  const [employmentTypes, setEmploymentTypes] = useState(toCsv(profile.employmentTypes));
  const [expectedSalaryMin, setExpectedSalaryMin] = useState(profile.expectedSalaryMin?.toString() ?? "");
  const [expectedSalaryMax, setExpectedSalaryMax] = useState(profile.expectedSalaryMax?.toString() ?? "");
  const [preferredIndustries, setPreferredIndustries] = useState(toCsv(profile.preferredIndustries));
  const [excludedCompanies, setExcludedCompanies] = useState(toCsv(profile.excludedCompanies));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaved(false);
    setError(null);
    const result = updatePreferencesSchema.safeParse({
      preferredTitles: fromCsv(preferredTitles),
      preferredLocations: fromCsv(preferredLocations),
      workMode: workMode || undefined,
      employmentTypes: fromCsv(employmentTypes),
      expectedSalaryMin: expectedSalaryMin ? Number(expectedSalaryMin) : undefined,
      expectedSalaryMax: expectedSalaryMax ? Number(expectedSalaryMax) : undefined,
      preferredIndustries: fromCsv(preferredIndustries),
      excludedCompanies: fromCsv(excludedCompanies),
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid input.");
      return;
    }
    setSaving(true);
    try {
      await api.put("/profile/preferences", result.data);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Job search preferences"
        action={<Button onClick={handleSave} loading={saving}>Save</Button>}
      />
      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      {saved && !error && (
        <div className="mb-4">
          <Alert tone="success">Saved.</Alert>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Preferred job titles"
          hint="Comma-separated"
          value={preferredTitles}
          onChange={(e) => setPreferredTitles(e.target.value)}
        />
        <TextField
          label="Preferred locations"
          hint="Comma-separated"
          value={preferredLocations}
          onChange={(e) => setPreferredLocations(e.target.value)}
        />
        <SelectField label="Work mode" value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
          <option value="">Not set</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
        </SelectField>
        <TextField
          label="Employment types"
          hint="Comma-separated: full_time, part_time, contract, internship, freelance"
          value={employmentTypes}
          onChange={(e) => setEmploymentTypes(e.target.value)}
        />
        <TextField
          label="Expected salary (min)"
          type="number"
          value={expectedSalaryMin}
          onChange={(e) => setExpectedSalaryMin(e.target.value)}
        />
        <TextField
          label="Expected salary (max)"
          type="number"
          value={expectedSalaryMax}
          onChange={(e) => setExpectedSalaryMax(e.target.value)}
        />
        <TextField
          label="Preferred industries"
          hint="Comma-separated"
          value={preferredIndustries}
          onChange={(e) => setPreferredIndustries(e.target.value)}
        />
        <TextField
          label="Excluded companies"
          hint="Comma-separated"
          value={excludedCompanies}
          onChange={(e) => setExcludedCompanies(e.target.value)}
        />
      </div>
    </Card>
  );
}
