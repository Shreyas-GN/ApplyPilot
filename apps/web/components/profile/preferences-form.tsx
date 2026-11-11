"use client";

import { useState } from "react";
import type { ProfileDto } from "@/lib/types";
import { updatePreferencesSchema } from "@applypilot/validators";
import { TextField, SelectField } from "@/components/ui/field";
import { api, ApiError } from "@/lib/api-client";
import {
  SectionFrame,
  TagListInput,
  type ProvenanceKind,
} from "./profile-editorial-ui";

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: "", label: "Any / Flexible" },
  { value: "internship", label: "Internship" },
  { value: "entry", label: "Entry / Junior (0–2 yrs)" },
  { value: "mid", label: "Mid-Level (3–5 yrs)" },
  { value: "senior", label: "Senior (6–9 yrs)" },
  { value: "lead", label: "Lead / Staff / Principal" },
  { value: "executive", label: "Director / VP / Executive" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

interface PreferencesFormProps {
  profile: ProfileDto;
  onUpdated?: (profile: ProfileDto) => void;
}

export function PreferencesForm({ profile, onUpdated }: PreferencesFormProps) {
  const [preferredTitles, setPreferredTitles] = useState<string[]>(
    profile.preferredTitles
  );
  const [preferredExperienceLevel, setPreferredExperienceLevel] = useState(
    profile.preferredExperienceLevel ?? ""
  );
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    profile.preferredLocations
  );
  const [workMode, setWorkMode] = useState(profile.workMode ?? "");
  const [employmentTypes, setEmploymentTypes] = useState<string[]>(
    profile.employmentTypes
  );
  const [expectedSalaryMin, setExpectedSalaryMin] = useState(
    profile.expectedSalaryMin?.toString() ?? ""
  );
  const [expectedSalaryMax, setExpectedSalaryMax] = useState(
    profile.expectedSalaryMax?.toString() ?? ""
  );
  const [preferredIndustries, setPreferredIndustries] = useState<string[]>(
    profile.preferredIndustries
  );
  const [excludedCompanies, setExcludedCompanies] = useState<string[]>(
    profile.excludedCompanies
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasAnyValue =
    preferredTitles.length > 0 ||
    Boolean(preferredExperienceLevel) ||
    preferredLocations.length > 0 ||
    Boolean(workMode) ||
    employmentTypes.length > 0 ||
    Boolean(expectedSalaryMin) ||
    Boolean(expectedSalaryMax) ||
    preferredIndustries.length > 0 ||
    excludedCompanies.length > 0;

  const provenance: ProvenanceKind = hasAnyValue ? "user" : "empty";

  function toggleEmploymentType(val: string) {
    setSaved(false);
    setEmploymentTypes((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  }

  async function handleSave() {
    setSaved(false);
    setError(null);
    const minSal =
      expectedSalaryMin.trim() !== "" ? Number(expectedSalaryMin) : null;
    const maxSal =
      expectedSalaryMax.trim() !== "" ? Number(expectedSalaryMax) : null;

    if (minSal !== null && maxSal !== null && minSal > maxSal) {
      setError("Minimum expected salary cannot exceed maximum salary.");
      return;
    }

    const result = updatePreferencesSchema.safeParse({
      preferredTitles,
      preferredExperienceLevel: preferredExperienceLevel || null,
      preferredLocations,
      workMode: workMode || null,
      employmentTypes,
      expectedSalaryMin: minSal,
      expectedSalaryMax: maxSal,
      preferredIndustries,
      excludedCompanies,
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid preferences input.");
      return;
    }

    setSaving(true);
    try {
      const updated = await api.put<ProfileDto>(
        "/profile/preferences",
        result.data
      );
      onUpdated?.(updated);
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : "Failed to save preferences."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionFrame
      id="section-career_preferences"
      sectionNumber="08"
      eyebrow="Targeting & Logistics"
      title="Career Preferences"
      description="Define target roles, seniority level, locations, work mode, employment type, salary range, and industries."
      provenance={provenance}
      saving={saving}
      saved={saved}
      error={error}
      onSave={handleSave}
      saveLabel="Save preferences"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TagListInput
          id="pref-target-roles"
          label="Target roles"
          hint="Used in match scoring"
          placeholder="e.g. Senior Frontend Engineer"
          items={preferredTitles}
          onChange={(next) => {
            setSaved(false);
            setPreferredTitles(next);
          }}
        />
        <SelectField
          name="preferredExperienceLevel"
          label="Experience level"
          value={preferredExperienceLevel}
          onChange={(e) => {
            setSaved(false);
            setPreferredExperienceLevel(e.target.value);
          }}
        >
          {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </SelectField>

        <TagListInput
          id="pref-locations"
          label="Locations"
          hint="Cities, regions, or Remote"
          placeholder="e.g. Remote, Bengaluru, San Francisco"
          items={preferredLocations}
          onChange={(next) => {
            setSaved(false);
            setPreferredLocations(next);
          }}
        />

        <SelectField
          name="workMode"
          label="Work mode"
          value={workMode}
          onChange={(e) => {
            setSaved(false);
            setWorkMode(e.target.value);
          }}
        >
          <option value="">Not set</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
        </SelectField>

        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-ap-body">
            Employment type
          </span>
          <div className="flex flex-wrap gap-2">
            {EMPLOYMENT_TYPE_OPTIONS.map((opt) => {
              const active = employmentTypes.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleEmploymentType(opt.value)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border-ap-ink bg-ap-ink text-ap-surface"
                      : "border-ap-line bg-ap-paper-deep text-ap-body hover:text-ap-ink"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <TextField
          name="expectedSalaryMin"
          label="Expected salary (min)"
          type="number"
          min={0}
          placeholder="e.g. 120000"
          value={expectedSalaryMin}
          onChange={(e) => {
            setSaved(false);
            setExpectedSalaryMin(e.target.value);
          }}
        />
        <TextField
          name="expectedSalaryMax"
          label="Expected salary (max)"
          type="number"
          min={0}
          placeholder="e.g. 170000"
          value={expectedSalaryMax}
          onChange={(e) => {
            setSaved(false);
            setExpectedSalaryMax(e.target.value);
          }}
        />

        <TagListInput
          id="pref-industries"
          label="Target industries"
          placeholder="e.g. SaaS, AI Infrastructure, FinTech"
          items={preferredIndustries}
          onChange={(next) => {
            setSaved(false);
            setPreferredIndustries(next);
          }}
        />
        <TagListInput
          id="pref-excluded-companies"
          label="Excluded companies"
          hint="Optional blocklist"
          placeholder="Company to skip"
          tone="vermilion"
          items={excludedCompanies}
          onChange={(next) => {
            setSaved(false);
            setExcludedCompanies(next);
          }}
        />
      </div>
    </SectionFrame>
  );
}
