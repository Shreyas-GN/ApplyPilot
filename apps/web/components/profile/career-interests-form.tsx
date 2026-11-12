"use client";

import { useState } from "react";
import type { ProfileDto } from "@/lib/types";
import { updatePreferencesSchema } from "@applypilot/validators";
import { api, ApiError } from "@/lib/api-client";
import {
  ProvenanceBadge,
  SectionFrame,
  TagListInput,
  type ProvenanceKind,
} from "./profile-editorial-ui";

interface CareerInterestsFormProps {
  profile: ProfileDto;
  onUpdated: (profile: ProfileDto) => void;
}

export function CareerInterestsForm({
  profile,
  onUpdated,
}: CareerInterestsFormProps) {
  const [desiredRoles, setDesiredRoles] = useState<string[]>(
    profile.desiredRoles ?? []
  );
  const [adjacentRoles, setAdjacentRoles] = useState<string[]>(
    profile.adjacentRoles ?? []
  );
  const [excludedRoles, setExcludedRoles] = useState<string[]>(
    profile.excludedRoles ?? []
  );
  const [preferredIndustries, setPreferredIndustries] = useState<string[]>(
    profile.preferredIndustries ?? []
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [actingSuggestion, setActingSuggestion] = useState<string | null>(null);

  const hasAnyValue =
    desiredRoles.length > 0 ||
    adjacentRoles.length > 0 ||
    excludedRoles.length > 0 ||
    preferredIndustries.length > 0;
  const provenance: ProvenanceKind = hasAnyValue ? "user" : "empty";

  const aiSuggestedRoles = profile.intelligence?.aiSuggestedRoles ?? [];

  async function persistInterests(next: {
    desiredRoles?: string[];
    adjacentRoles?: string[];
    excludedRoles?: string[];
    preferredIndustries?: string[];
    dismissSuggestedRole?: string;
  }) {
    const result = updatePreferencesSchema.safeParse({
      desiredRoles: next.desiredRoles ?? desiredRoles,
      adjacentRoles: next.adjacentRoles ?? adjacentRoles,
      excludedRoles: next.excludedRoles ?? excludedRoles,
      preferredIndustries: next.preferredIndustries ?? preferredIndustries,
      ...(next.dismissSuggestedRole
        ? { dismissSuggestedRole: next.dismissSuggestedRole }
        : {}),
    });
    if (!result.success) {
      throw new Error(result.error.issues[0]?.message ?? "Invalid interest inputs.");
    }
    const updated = await api.put<ProfileDto>("/profile/preferences", result.data);
    onUpdated(updated);
    return updated;
  }

  async function handleSave() {
    setSaved(false);
    setError(null);
    setSaving(true);
    try {
      await persistInterests({});
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : "Failed to save career interests."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAcceptSuggestion(
    role: string,
    target: "desired" | "adjacent"
  ) {
    setError(null);
    setSaved(false);
    setActingSuggestion(role);
    try {
      const nextDesired =
        target === "desired" &&
        !desiredRoles.some((r) => r.toLowerCase() === role.toLowerCase())
          ? [...desiredRoles, role]
          : desiredRoles;
      const nextAdjacent =
        target === "adjacent" &&
        !adjacentRoles.some((r) => r.toLowerCase() === role.toLowerCase())
          ? [...adjacentRoles, role]
          : adjacentRoles;

      setDesiredRoles(nextDesired);
      setAdjacentRoles(nextAdjacent);
      await persistInterests({
        desiredRoles: nextDesired,
        adjacentRoles: nextAdjacent,
      });
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail
          : "Failed to add suggested role."
      );
    } finally {
      setActingSuggestion(null);
    }
  }

  async function handleDismissSuggestion(role: string) {
    setError(null);
    setActingSuggestion(role);
    try {
      await persistInterests({ dismissSuggestedRole: role });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail
          : "Failed to dismiss suggestion."
      );
    } finally {
      setActingSuggestion(null);
    }
  }

  return (
    <SectionFrame
      id="section-career_interests"
      sectionNumber="09"
      eyebrow="Exploration & Boundaries"
      title="Career Interests"
      description="Distinguish the exact roles you want next, adjacent paths you are open to exploring, roles to exclude, and target industries."
      provenance={provenance}
      saving={saving}
      saved={saved}
      error={error}
      onSave={handleSave}
      saveLabel="Save interests"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TagListInput
          id="interest-desired-roles"
          label="Roles I want"
          hint="Primary tracks"
          placeholder="e.g. Staff Frontend Engineer"
          tone="sage"
          items={desiredRoles}
          onChange={(next) => {
            setSaved(false);
            setDesiredRoles(next);
          }}
        />
        <TagListInput
          id="interest-adjacent-roles"
          label="Adjacent roles open to exploring"
          hint="Stretch or lateral"
          placeholder="e.g. Design Engineer, Solutions Architect"
          items={adjacentRoles}
          onChange={(next) => {
            setSaved(false);
            setAdjacentRoles(next);
          }}
        />
        <TagListInput
          id="interest-excluded-roles"
          label="Excluded roles"
          hint="Filter out"
          placeholder="e.g. Technical Support, Sales Engineer"
          tone="vermilion"
          items={excludedRoles}
          onChange={(next) => {
            setSaved(false);
            setExcludedRoles(next);
          }}
        />
        <TagListInput
          id="interest-preferred-industries"
          label="Preferred industries"
          hint="Domain focus"
          placeholder="e.g. Developer Tools, FinTech, Climate"
          items={preferredIndustries}
          onChange={(next) => {
            setSaved(false);
            setPreferredIndustries(next);
          }}
        />
      </div>

      {aiSuggestedRoles.length > 0 && (
        <div className="mt-6 rounded-xl border border-ap-vermilion/20 bg-ui-linen/60 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-ui-ink">
                  Suggested career tracks to consider
                </h3>
                <ProvenanceBadge kind="ai_suggested" />
              </div>
              <p className="mt-0.5 text-xs text-ui-muted">
                Generated from your user-confirmed skills and history. These remain unverified suggestions until you add them.
              </p>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {aiSuggestedRoles.map((suggestion) => {
              const busy = actingSuggestion === suggestion.role;
              return (
                <div
                  key={suggestion.role}
                  className="flex flex-col justify-between gap-2.5 rounded-lg border border-ui-border bg-ui-surface p-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ui-ink">
                        {suggestion.role}
                      </span>
                      <span className="font-mono text-[11px] uppercase text-ui-muted">
                        {suggestion.kind === "adjacent" ? "Adjacent" : "Core fit"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ui-muted">{suggestion.reason}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        handleAcceptSuggestion(suggestion.role, "desired")
                      }
                      className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:opacity-90 disabled:opacity-50"
                    >
                      + Roles I want
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        handleAcceptSuggestion(suggestion.role, "adjacent")
                      }
                      className="rounded-full border border-ui-border bg-ui-linen px-2.5 py-1 text-xs font-medium text-ui-ink hover:bg-ui-linen disabled:opacity-50"
                    >
                      + Adjacent
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDismissSuggestion(suggestion.role)}
                      className="ml-auto text-xs text-ui-muted hover:text-ui-ink disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </SectionFrame>
  );
}

