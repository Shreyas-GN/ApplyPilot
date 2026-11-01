"use client";

import { useState, type KeyboardEvent } from "react";
import type { SkillDto } from "@applypilot/shared";
import { replaceSkillsSchema } from "@applypilot/validators";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { api, ApiError } from "@/lib/api-client";

export function SkillsEditor({ skills }: { skills: SkillDto[] }) {
  const [items, setItems] = useState(skills);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function addFromDraft() {
    const name = draft.trim();
    if (!name) return;
    if (items.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setDraft("");
      return;
    }
    setItems((prev) => [...prev, { id: `draft-${prev.length}`, name, category: null, source: "user", confidence: null }]);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addFromDraft();
    }
  }

  function remove(name: string) {
    setItems((prev) => prev.filter((s) => s.name !== name));
  }

  async function handleSave() {
    setSaved(false);
    setError(null);
    const result = replaceSkillsSchema.safeParse({ items: items.map((s) => ({ name: s.name, category: s.category ?? undefined })) });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid input.");
      return;
    }
    setSaving(true);
    try {
      await api.put("/profile/skills", result.data);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Skills" action={<Button onClick={handleSave} loading={saving}>Save</Button>} />
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
      <div className="mb-3 flex flex-wrap gap-2">
        {items.length === 0 && <p className="text-sm text-slate-400">No skills added yet.</p>}
        {items.map((skill) => (
          <span
            key={skill.name}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
          >
            {skill.name}
            {skill.source === "ai" && <span className="text-xs text-brand-600">(AI)</span>}
            <button
              type="button"
              onClick={() => remove(skill.name)}
              aria-label={`Remove ${skill.name}`}
              className="text-slate-400 hover:text-red-500"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addFromDraft}
        placeholder="Type a skill and press Enter"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400"
      />
    </Card>
  );
}
