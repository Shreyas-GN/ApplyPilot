"use client";

import { useMemo, useState } from "react";
import type { ProfileDto, SkillDto } from "@/lib/types";
import { replaceSkillsSchema } from "@applypilot/validators";
import { api, ApiError } from "@/lib/api-client";
import {
  ProvenanceBadge,
  SectionFrame,
  type ProvenanceKind,
} from "./profile-editorial-ui";

const SKILL_CATEGORIES = [
  "Languages",
  "Frontend",
  "Backend & APIs",
  "Databases & Storage",
  "Cloud & DevOps",
  "AI & Data",
  "Testing & Tooling",
  "Domain & Leadership",
];

const PROFICIENCY_OPTIONS = [
  { value: "", label: "Proficiency" },
  { value: "foundational", label: "Foundational" },
  { value: "working", label: "Working knowledge" },
  { value: "proficient", label: "Proficient" },
  { value: "expert", label: "Expert" },
];

interface EditableSkill {
  id: string;
  name: string;
  category: string;
  proficiency: string;
  yearsOfExperience: string;
  evidence: string;
  source: "user" | "ai";
  confidence: number | null;
}

function toEditable(skill: SkillDto): EditableSkill {
  return {
    id: skill.id,
    name: skill.name,
    category: skill.category ?? "",
    proficiency: skill.proficiency ?? "",
    yearsOfExperience:
      skill.yearsOfExperience !== null && skill.yearsOfExperience !== undefined
        ? String(skill.yearsOfExperience)
        : "",
    evidence: skill.evidence ?? "",
    source: skill.source,
    confidence: skill.confidence,
  };
}

interface SkillsEditorProps {
  skills: SkillDto[];
  onUpdated?: (profile: ProfileDto) => void;
}

export function SkillsEditor({ skills, onUpdated }: SkillsEditorProps) {
  const [items, setItems] = useState<EditableSkill[]>(() =>
    skills.map(toEditable)
  );
  const [nameDraft, setNameDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("Languages");
  const [proficiencyDraft, setProficiencyDraft] = useState("proficient");
  const [yearsDraft, setYearsDraft] = useState("");
  const [evidenceDraft, setEvidenceDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const aiCount = items.filter((s) => s.source === "ai").length;
  const userCount = items.filter((s) => s.source !== "ai").length;

  const provenance: ProvenanceKind =
    items.length === 0
      ? "empty"
      : aiCount > 0 && userCount === 0
        ? "ai_extracted"
        : "user";

  const grouped = useMemo(() => {
    const groups = new Map<string, { skill: EditableSkill; index: number }[]>();
    items.forEach((skill, index) => {
      const cat = skill.category.trim() || "Uncategorized";
      const list = groups.get(cat) ?? [];
      list.push({ skill, index });
      groups.set(cat, list);
    });
    return Array.from(groups.entries());
  }, [items]);

  function addSkill() {
    const rawNames = nameDraft
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (rawNames.length === 0) return;

    const existing = new Set(items.map((s) => s.name.toLowerCase()));
    const additions: EditableSkill[] = [];
    for (const skillName of rawNames) {
      if (existing.has(skillName.toLowerCase())) continue;
      existing.add(skillName.toLowerCase());
      additions.push({
        id: `draft-${Date.now()}-${additions.length}`,
        name: skillName,
        category: categoryDraft,
        proficiency: proficiencyDraft,
        yearsOfExperience: yearsDraft,
        evidence: evidenceDraft.trim(),
        source: "user",
        confidence: null,
      });
    }

    if (additions.length > 0) {
      setSaved(false);
      setItems((prev) => [...prev, ...additions]);
    }
    setNameDraft("");
    setYearsDraft("");
    setEvidenceDraft("");
  }

  function updateItem(index: number, patch: Partial<EditableSkill>) {
    setSaved(false);
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, ...patch, source: "user", confidence: null } : item
      )
    );
  }

  function confirmItem(index: number) {
    setSaved(false);
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, source: "user" } : item))
    );
  }

  function confirmAllAi() {
    setSaved(false);
    setItems((prev) => prev.map((item) => ({ ...item, source: "user" })));
  }

  function removeItem(index: number) {
    setSaved(false);
    setEditingIndex((cur) => (cur === index ? null : cur));
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function persistSkills(targetItems: EditableSkill[]) {
    setSaved(false);
    setError(null);
    const payload = {
      items: targetItems.map((s) => ({
        name: s.name,
        category: s.category || undefined,
        proficiency: s.proficiency || null,
        yearsOfExperience:
          s.yearsOfExperience.trim() !== ""
            ? Number(s.yearsOfExperience)
            : null,
        evidence: s.evidence || undefined,
        source: s.source,
        confidence: s.confidence,
      })),
    };

    const result = replaceSkillsSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid skill values.");
      return;
    }

    setSaving(true);
    try {
      const updated = await api.put<ProfileDto>("/profile/skills", result.data);
      setItems(updated.skills.map(toEditable));
      onUpdated?.(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to save skills.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionFrame
      id="section-skills"
      sectionNumber="03"
      eyebrow="Capabilities Matrix"
      title="Skills & Technologies"
      description="Organize technical & domain skills by category, proficiency, years of experience, and concrete evidence."
      provenance={provenance}
      saving={saving}
      saved={saved}
      error={error}
      onSave={() => persistSkills(items)}
      saveLabel="Save skills"
      confirmAction={
        aiCount > 0
          ? {
              label: `Confirm ${aiCount} AI skill${aiCount === 1 ? "" : "s"}`,
              onClick: async () => {
                const confirmed = items.map((s) => ({
                  ...s,
                  source: "user" as const,
                }));
                confirmAllAi();
                await persistSkills(confirmed);
              },
              loading: saving,
            }
          : undefined
      }
    >
      <div className="mb-5 rounded-xl border border-ui-border bg-ui-linen/50 p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ui-muted">
            Add Skill Entry
          </span>
          <span className="text-xs text-ui-muted">
            Comma-separated names allowed for batch entry
          </span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-12">
          <input
            type="text"
            aria-label="Skill name"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder="e.g. TypeScript, PostgreSQL"
            className="h-9 rounded-lg border border-ui-border bg-ui-surface px-3 text-sm text-ui-ink placeholder:text-ui-muted outline-none focus:border-ap-vermilion sm:col-span-4"
          />
          <select
            aria-label="Skill category"
            value={categoryDraft}
            onChange={(e) => setCategoryDraft(e.target.value)}
            className="h-9 rounded-lg border border-ui-border bg-ui-surface px-2.5 text-sm text-ui-ink outline-none focus:border-ap-vermilion sm:col-span-3"
          >
            {SKILL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            aria-label="Skill proficiency"
            value={proficiencyDraft}
            onChange={(e) => setProficiencyDraft(e.target.value)}
            className="h-9 rounded-lg border border-ui-border bg-ui-surface px-2.5 text-sm text-ui-ink outline-none focus:border-ap-vermilion sm:col-span-3"
          >
            {PROFICIENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            max={60}
            step={0.5}
            aria-label="Years using skill"
            value={yearsDraft}
            onChange={(e) => setYearsDraft(e.target.value)}
            placeholder="Yrs"
            className="h-9 rounded-lg border border-ui-border bg-ui-surface px-2.5 text-sm text-ui-ink placeholder:text-ui-muted outline-none focus:border-ap-vermilion sm:col-span-2"
          />
        </div>
        <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            aria-label="Skill evidence"
            value={evidenceDraft}
            onChange={(e) => setEvidenceDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder="Evidence (optional): e.g. Shipped 4 production microservices & OSS CLI"
            className="h-9 min-w-0 flex-1 rounded-lg border border-ui-border bg-ui-surface px-3 text-sm text-ui-ink placeholder:text-ui-muted outline-none focus:border-ap-vermilion"
          />
          <button
            type="button"
            onClick={addSkill}
            className="h-9 shrink-0 rounded-lg border border-ui-border bg-ui-surface px-4 text-xs font-medium text-ui-ink hover:bg-ui-linen"
          >
            + Add skill
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-ui-muted">
          No skills recorded yet. Add your core languages, frameworks, infrastructure, or domain capabilities above.
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([category, groupItems]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ui-muted">
                  {category} ({groupItems.length})
                </h3>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {groupItems.map(({ skill, index }) => {
                  const isEditing = editingIndex === index;
                  const isAi = skill.source === "ai";
                  return (
                    <div
                      key={`${skill.name}-${index}`}
                      className={`rounded-xl border p-3 ${
                        isAi
                          ? "border-amber-300 bg-ap-butter/20"
                          : "border-ui-border bg-ui-surface"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-semibold text-ui-ink">
                              {skill.name}
                            </span>
                            {skill.proficiency && (
                              <span className="rounded-full bg-ui-linen px-2 py-0.5 text-[11px] font-medium capitalize text-ui-body">
                                {skill.proficiency}
                              </span>
                            )}
                            {skill.yearsOfExperience && (
                              <span className="font-mono text-[11px] text-ui-muted">
                                {skill.yearsOfExperience}y
                              </span>
                            )}
                          </div>
                          {skill.evidence && (
                            <p className="mt-1 text-xs text-ui-muted">
                              {skill.evidence}
                            </p>
                          )}
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <ProvenanceBadge
                              kind={isAi ? "ai_extracted" : "user"}
                              confidence={skill.confidence}
                            />
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {isAi && (
                            <button
                              type="button"
                              onClick={() => confirmItem(index)}
                              className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:opacity-90"
                            >
                              Confirm
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setEditingIndex(isEditing ? null : index)
                            }
                            className="text-xs font-medium text-ui-body hover:text-ui-ink hover:underline"
                          >
                            {isEditing ? "Done" : "Edit"}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            aria-label={`Remove ${skill.name}`}
                            className="text-xs font-medium text-ap-danger hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-3 grid gap-2 border-t border-ui-border pt-3 sm:grid-cols-2">
                          <select
                            aria-label={`Edit category for ${skill.name}`}
                            value={skill.category}
                            onChange={(e) =>
                              updateItem(index, { category: e.target.value })
                            }
                            className="h-8 rounded-md border border-ui-border bg-ui-surface px-2 text-xs text-ui-ink"
                          >
                            <option value="">Uncategorized</option>
                            {SKILL_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                          <select
                            aria-label={`Edit proficiency for ${skill.name}`}
                            value={skill.proficiency}
                            onChange={(e) =>
                              updateItem(index, { proficiency: e.target.value })
                            }
                            className="h-8 rounded-md border border-ui-border bg-ui-surface px-2 text-xs text-ui-ink"
                          >
                            {PROFICIENCY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min={0}
                            max={60}
                            step={0.5}
                            aria-label={`Edit years for ${skill.name}`}
                            value={skill.yearsOfExperience}
                            onChange={(e) =>
                              updateItem(index, {
                                yearsOfExperience: e.target.value,
                              })
                            }
                            placeholder="Years"
                            className="h-8 rounded-md border border-ui-border bg-ui-surface px-2 text-xs text-ui-ink"
                          />
                          <input
                            type="text"
                            aria-label={`Edit evidence for ${skill.name}`}
                            value={skill.evidence}
                            onChange={(e) =>
                              updateItem(index, { evidence: e.target.value })
                            }
                            placeholder="Evidence / project reference"
                            className="h-8 rounded-md border border-ui-border bg-ui-surface px-2 text-xs text-ui-ink"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionFrame>
  );
}
