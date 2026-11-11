"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export type ProvenanceKind = "user" | "ai_extracted" | "ai_suggested" | "empty";

export function ProvenanceBadge({
  kind,
  confidence,
}: {
  kind: ProvenanceKind;
  confidence?: number | null;
}) {
  if (kind === "empty") {
    return (
      <span className="inline-flex items-center rounded-full border border-ap-line bg-ap-surface-muted px-2.5 py-0.5 font-mono text-[11px] font-medium text-ap-muted">
        Not yet added
      </span>
    );
  }

  if (kind === "user") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-ap-sage-soft px-2.5 py-0.5 font-mono text-[11px] font-medium text-ap-sage">
        <span aria-hidden="true">✓</span> User-confirmed
      </span>
    );
  }

  if (kind === "ai_suggested") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-ap-vermilion-soft px-2.5 py-0.5 font-mono text-[11px] font-medium text-ap-vermilion">
        AI-suggested · unverified
      </span>
    );
  }

  const pct =
    confidence !== null && confidence !== undefined
      ? ` (${Math.round(confidence * 100)}%)`
      : "";

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ap-butter px-2.5 py-0.5 font-mono text-[11px] font-medium text-ap-ink">
      AI-extracted{pct} · verify
    </span>
  );
}

interface SectionFrameProps {
  id: string;
  sectionNumber: string;
  eyebrow: string;
  title: string;
  description: string;
  provenance: ProvenanceKind;
  saving?: boolean;
  saved?: boolean;
  error?: string | null;
  onSave?: () => void;
  saveLabel?: string;
  confirmAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  extraHeaderAction?: ReactNode;
  children: ReactNode;
}

export function SectionFrame({
  id,
  sectionNumber,
  eyebrow,
  title,
  description,
  provenance,
  saving = false,
  saved = false,
  error = null,
  onSave,
  saveLabel = "Save section",
  confirmAction,
  extraHeaderAction,
  children,
}: SectionFrameProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-24 rounded-[14px] border border-ap-line bg-ap-surface p-5 shadow-[0_1px_2px_rgba(30,25,21,0.04)] sm:p-6"
    >
      <div className="mb-5 flex flex-col gap-3 border-b border-ap-line pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ap-muted">
              {sectionNumber} · {eyebrow}
            </span>
            <ProvenanceBadge kind={provenance} />
          </div>
          <h2
            id={`${id}-heading`}
            className="font-display text-[22px] leading-[1.2] tracking-[-0.015em] text-ap-ink"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-ap-muted">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {confirmAction && (
            <button
              type="button"
              onClick={confirmAction.onClick}
              disabled={confirmAction.loading}
              className="inline-flex h-9 items-center justify-center rounded-full border border-ap-sage bg-ap-sage-soft px-3.5 text-xs font-medium text-ap-sage transition hover:opacity-90 disabled:opacity-50"
            >
              {confirmAction.loading ? "Confirming…" : confirmAction.label}
            </button>
          )}
          {extraHeaderAction}
          {onSave && (
            <Button
              type="button"
              onClick={onSave}
              loading={saving}
              className="rounded-full bg-ap-ink px-4 text-xs font-medium text-ap-surface hover:bg-ap-body"
            >
              {saveLabel}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      {saved && !error && (
        <div className="mb-4">
          <Alert tone="success">Changes saved to your profile.</Alert>
        </div>
      )}

      {children}
    </section>
  );
}

interface TagListInputProps {
  id?: string;
  label: string;
  hint?: string;
  placeholder?: string;
  items: string[];
  onChange: (next: string[]) => void;
  tone?: "default" | "sage" | "vermilion";
}

export function TagListInput({
  id,
  label,
  hint,
  placeholder = "Type and press Enter or comma",
  items,
  onChange,
  tone = "default",
}: TagListInputProps) {
  const [draft, setDraft] = useState("");
  const inputId = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  function commitDraft() {
    const rawParts = draft
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (rawParts.length === 0) {
      setDraft("");
      return;
    }
    const existing = new Set(items.map((item) => item.toLowerCase()));
    const additions: string[] = [];
    for (const part of rawParts) {
      if (!existing.has(part.toLowerCase())) {
        existing.add(part.toLowerCase());
        additions.push(part);
      }
    }
    if (additions.length > 0) {
      onChange([...items, ...additions]);
    }
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && !draft && items.length > 0) {
      onChange(items.slice(0, -1));
    }
  }

  const chipTone =
    tone === "sage"
      ? "border-ap-sage/30 bg-ap-sage-soft text-ap-sage"
      : tone === "vermilion"
        ? "border-ap-vermilion/25 bg-ap-vermilion-soft text-ap-vermilion"
        : "border-ap-line bg-ap-paper-deep text-ap-ink";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-ap-body">
          {label}
        </label>
        {hint && <span className="text-xs text-ap-muted">{hint}</span>}
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 py-1">
          {items.map((item) => (
            <span
              key={item}
              className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${chipTone}`}
            >
              <span className="truncate">{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((v) => v !== item))}
                aria-label={`Remove ${item}`}
                className="shrink-0 opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={placeholder}
          className="h-9 min-w-0 flex-1 rounded-lg border border-ap-line bg-ap-surface px-3 text-sm text-ap-ink placeholder:text-ap-muted outline-none focus:border-ap-vermilion"
        />
        <button
          type="button"
          onClick={commitDraft}
          className="h-9 shrink-0 rounded-lg border border-ap-line bg-ap-paper-deep px-3 text-xs font-medium text-ap-ink hover:bg-ap-surface-muted"
        >
          Add
        </button>
      </div>
    </div>
  );
}

interface BulletListInputProps {
  id?: string;
  label: string;
  hint?: string;
  placeholder?: string;
  items: string[];
  onChange: (next: string[]) => void;
}

export function BulletListInput({
  id,
  label,
  hint,
  placeholder = "Add a bullet point and press Enter",
  items,
  onChange,
}: BulletListInputProps) {
  const [draft, setDraft] = useState("");
  const inputId = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  function addBullet() {
    const lines = draft
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);
    if (lines.length === 0) {
      setDraft("");
      return;
    }
    const existing = new Set(items.map((i) => i.toLowerCase()));
    const next = [...items];
    for (const line of lines) {
      if (!existing.has(line.toLowerCase())) {
        existing.add(line.toLowerCase());
        next.push(line);
      }
    }
    onChange(next);
    setDraft("");
  }

  function updateLine(index: number, value: string) {
    onChange(items.map((item, i) => (i === index ? value : item)));
  }

  function removeLine(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-ap-body">
          {label}
        </label>
        {hint && <span className="text-xs text-ap-muted">{hint}</span>}
      </div>

      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((item, index) => (
            <li key={`${index}-${item.slice(0, 12)}`} className="flex items-center gap-2">
              <span className="font-mono text-xs text-ap-muted">•</span>
              <input
                type="text"
                value={item}
                aria-label={`${label} item ${index + 1}`}
                onChange={(e) => updateLine(index, e.target.value)}
                className="h-8 min-w-0 flex-1 rounded-md border border-ap-line bg-ap-surface px-2.5 text-sm text-ap-ink outline-none focus:border-ap-vermilion"
              />
              <button
                type="button"
                onClick={() => removeLine(index)}
                aria-label={`Remove ${label} item ${index + 1}`}
                className="shrink-0 rounded px-1.5 py-1 text-xs font-medium text-ap-danger hover:bg-red-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addBullet();
            }
          }}
          placeholder={placeholder}
          className="h-9 min-w-0 flex-1 rounded-lg border border-ap-line bg-ap-surface px-3 text-sm text-ap-ink placeholder:text-ap-muted outline-none focus:border-ap-vermilion"
        />
        <button
          type="button"
          onClick={addBullet}
          className="h-9 shrink-0 rounded-lg border border-ap-line bg-ap-paper-deep px-3 text-xs font-medium text-ap-ink hover:bg-ap-surface-muted"
        >
          Add
        </button>
      </div>
    </div>
  );
}

