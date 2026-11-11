"use client";

import { useState } from "react";
import { TextField, TextAreaField } from "@/components/ui/field";
import {
  BulletListInput,
  ProvenanceBadge,
  SectionFrame,
  TagListInput,
  type ProvenanceKind,
} from "./profile-editorial-ui";

// Legacy exports kept verbatim for ControlledEntryList (/resumes/[id]/review)
export type FieldType = "text" | "textarea" | "checkbox";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
}

export type ItemValues = Record<string, string | boolean>;

// Rich field types for the 9-section Candidate Intelligence Profile
export type RichFieldType =
  | FieldType
  | "number"
  | "tags"
  | "bullets"
  | "url";

export interface RichFieldConfig {
  name: string;
  label: string;
  type: RichFieldType;
  placeholder?: string;
  hint?: string;
  fullWidth?: boolean;
}

export type RichItemValues = Record<string, string | boolean | string[]>;

export interface RepeatableSectionItem {
  values: RichItemValues;
  source?: "user" | "ai";
  confidence?: number | null;
}

export interface RepeatableSaveEntry {
  values: RichItemValues;
  source: "user" | "ai";
  confidence: number | null;
}

interface RepeatableSectionProps {
  id: string;
  sectionNumber: string;
  eyebrow: string;
  title: string;
  description?: string;
  fields: RichFieldConfig[];
  initialItems: RepeatableSectionItem[];
  onSave: (items: RepeatableSaveEntry[]) => Promise<void>;
  emptyLabel: string;
  addLabel?: string;
  itemTitleKey?: string;
  itemSubtitleKey?: string;
}

function blankValues(fields: RichFieldConfig[]): RichItemValues {
  const values: RichItemValues = {};
  for (const field of fields) {
    if (field.type === "checkbox") {
      values[field.name] = false;
    } else if (field.type === "tags" || field.type === "bullets") {
      values[field.name] = [];
    } else {
      values[field.name] = "";
    }
  }
  return values;
}

export function RepeatableSection({
  id,
  sectionNumber,
  eyebrow,
  title,
  description,
  fields,
  initialItems,
  onSave,
  emptyLabel,
  addLabel = "+ Add entry",
  itemTitleKey,
  itemSubtitleKey,
}: RepeatableSectionProps) {
  const [items, setItems] = useState<RepeatableSectionItem[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const aiCount = items.filter((item) => item.source === "ai").length;
  const userCount = items.filter((item) => item.source !== "ai").length;
  const sectionProvenance: ProvenanceKind =
    items.length === 0
      ? "empty"
      : aiCount > 0 && userCount === 0
        ? "ai_extracted"
        : "user";

  function updateField(
    index: number,
    name: string,
    value: string | boolean | string[]
  ) {
    setSaved(false);
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              source: "user",
              confidence: null,
              values: { ...item.values, [name]: value },
            }
          : item
      )
    );
  }

  function confirmItem(index: number) {
    setSaved(false);
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, source: "user" } : item
      )
    );
  }

  function addItem() {
    setSaved(false);
    setItems((prev) => [
      ...prev,
      { values: blankValues(fields), source: "user", confidence: null },
    ]);
  }

  function removeItem(index: number) {
    setSaved(false);
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveEntries(targetItems: RepeatableSectionItem[]) {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await onSave(
        targetItems.map((item) => ({
          values: item.values,
          source: item.source === "ai" ? "ai" : "user",
          confidence: item.confidence ?? null,
        }))
      );
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmAllAi() {
    const confirmed = items.map((item) => ({
      ...item,
      source: "user" as const,
    }));
    setItems(confirmed);
    await saveEntries(confirmed);
  }

  return (
    <SectionFrame
      id={id}
      sectionNumber={sectionNumber}
      eyebrow={eyebrow}
      title={title}
      description={description ?? ""}
      provenance={sectionProvenance}
      saving={saving}
      saved={saved}
      error={error}
      onSave={() => saveEntries(items)}
      saveLabel="Save section"
      confirmAction={
        aiCount > 0
          ? {
              label: `Confirm ${aiCount} AI ${aiCount === 1 ? "entry" : "entries"}`,
              onClick: handleConfirmAllAi,
              loading: saving,
            }
          : undefined
      }
    >
      {items.length === 0 && (
        <p className="mb-4 text-sm text-ap-muted">{emptyLabel}</p>
      )}

      <div className="flex flex-col gap-4">
        {items.map((item, index) => {
          const isAi = item.source === "ai";
          const headerTitle = itemTitleKey
            ? String(item.values[itemTitleKey] ?? "").trim()
            : "";
          const headerSub = itemSubtitleKey
            ? String(item.values[itemSubtitleKey] ?? "").trim()
            : "";

          return (
            <div
              key={index}
              className={`rounded-xl border p-4 ${
                isAi
                  ? "border-amber-300 bg-ap-butter/20"
                  : "border-ap-line bg-ap-paper-deep/35"
              }`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-ap-line/70 pb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] font-medium uppercase text-ap-muted">
                    #{index + 1}
                  </span>
                  {headerTitle && (
                    <span className="text-sm font-semibold text-ap-ink">
                      {headerTitle}
                      {headerSub ? ` · ${headerSub}` : ""}
                    </span>
                  )}
                  <ProvenanceBadge
                    kind={isAi ? "ai_extracted" : "user"}
                    confidence={item.confidence}
                  />
                </div>

                <div className="flex items-center gap-2">
                  {isAi && (
                    <button
                      type="button"
                      onClick={() => confirmItem(index)}
                      className="rounded-full bg-ap-sage-soft px-2.5 py-0.5 text-xs font-medium text-ap-sage hover:opacity-90"
                    >
                      Confirm entry
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-xs font-medium text-ap-danger hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                {fields.map((field) => {
                  if (field.type === "checkbox") {
                    return (
                      <label
                        key={field.name}
                        className="flex items-center gap-2 pt-1 text-sm font-medium text-ap-body sm:col-span-2"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(item.values[field.name])}
                          onChange={(e) =>
                            updateField(index, field.name, e.target.checked)
                          }
                          className="h-4 w-4 rounded border-ap-line accent-ap-ink"
                        />
                        {field.label}
                      </label>
                    );
                  }

                  if (field.type === "textarea") {
                    return (
                      <div key={field.name} className="sm:col-span-2">
                        <TextAreaField
                          name={`${id}-${field.name}-${index}`}
                          label={field.label}
                          hint={field.hint}
                          placeholder={field.placeholder}
                          value={String(item.values[field.name] ?? "")}
                          onChange={(e) =>
                            updateField(index, field.name, e.target.value)
                          }
                          rows={3}
                        />
                      </div>
                    );
                  }

                  if (field.type === "tags") {
                    const list = Array.isArray(item.values[field.name])
                      ? (item.values[field.name] as string[])
                      : [];
                    return (
                      <div key={field.name} className="sm:col-span-2">
                        <TagListInput
                          id={`${id}-${field.name}-${index}`}
                          label={field.label}
                          hint={field.hint}
                          placeholder={field.placeholder}
                          items={list}
                          onChange={(next) =>
                            updateField(index, field.name, next)
                          }
                        />
                      </div>
                    );
                  }

                  if (field.type === "bullets") {
                    const list = Array.isArray(item.values[field.name])
                      ? (item.values[field.name] as string[])
                      : [];
                    return (
                      <div key={field.name} className="sm:col-span-2">
                        <BulletListInput
                          id={`${id}-${field.name}-${index}`}
                          label={field.label}
                          hint={field.hint}
                          placeholder={field.placeholder}
                          items={list}
                          onChange={(next) =>
                            updateField(index, field.name, next)
                          }
                        />
                      </div>
                    );
                  }

                  const rawValue = String(item.values[field.name] ?? "");
                  const isSafeUrl =
                    field.type === "url" &&
                    /^https?:\/\/.+/i.test(rawValue.trim());

                  return (
                    <div
                      key={field.name}
                      className={field.fullWidth ? "sm:col-span-2" : undefined}
                    >
                      <TextField
                        name={`${id}-${field.name}-${index}`}
                        type={field.type === "number" ? "number" : "text"}
                        label={field.label}
                        hint={field.hint}
                        placeholder={field.placeholder}
                        value={rawValue}
                        onChange={(e) =>
                          updateField(index, field.name, e.target.value)
                        }
                      />
                      {isSafeUrl && (
                        <a
                          href={rawValue.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs font-medium text-ap-vermilion hover:underline"
                        >
                          Open link ↗
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mt-4 inline-flex h-9 items-center justify-center rounded-full border border-ap-line bg-ap-paper-deep px-4 text-xs font-medium text-ap-ink transition hover:bg-ap-surface-muted"
      >
        {addLabel}
      </button>
    </SectionFrame>
  );
}
