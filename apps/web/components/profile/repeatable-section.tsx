"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export type FieldType = "text" | "textarea" | "checkbox";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
}

export type ItemValues = Record<string, string | boolean>;

interface Item {
  values: ItemValues;
  source?: "user" | "ai";
  confidence?: number | null;
}

const LOW_CONFIDENCE_THRESHOLD = 0.6;

interface RepeatableSectionProps {
  title: string;
  description?: string;
  fields: FieldConfig[];
  initialItems: Item[];
  onSave: (items: ItemValues[]) => Promise<void>;
  emptyLabel: string;
}

function blankValues(fields: FieldConfig[]): ItemValues {
  const values: ItemValues = {};
  for (const field of fields) {
    values[field.name] = field.type === "checkbox" ? false : "";
  }
  return values;
}

export function RepeatableSection({
  title,
  description,
  fields,
  initialItems,
  onSave,
  emptyLabel,
}: RepeatableSectionProps) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function updateField(index: number, name: string, value: string | boolean) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, values: { ...item.values, [name]: value } } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { values: blankValues(fields), source: "user" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(items.map((item) => item.values));
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title={title}
        description={description}
        action={<Button onClick={handleSave} loading={saving}>Save</Button>}
      />
      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      {savedAt && !error && (
        <div className="mb-4">
          <Alert tone="success">Saved.</Alert>
        </div>
      )}
      {items.length === 0 && <p className="mb-4 text-sm text-slate-400">{emptyLabel}</p>}
      <div className="flex flex-col gap-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {item.source === "ai" && <Badge>AI-suggested</Badge>}
                {item.source === "ai" &&
                  (item.confidence === null ||
                    item.confidence === undefined ||
                    item.confidence < LOW_CONFIDENCE_THRESHOLD) && (
                    <span className="text-xs font-medium text-amber-700">Low confidence — please verify</span>
                  )}
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-xs font-medium text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((field) => {
                if (field.type === "checkbox") {
                  return (
                    <label key={field.name} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(item.values[field.name])}
                        onChange={(e) => updateField(index, field.name, e.target.checked)}
                      />
                      {field.label}
                    </label>
                  );
                }
                if (field.type === "textarea") {
                  return (
                    <div key={field.name} className="sm:col-span-2">
                      <TextAreaField
                        name={`${field.name}-${index}`}
                        label={field.label}
                        placeholder={field.placeholder}
                        value={String(item.values[field.name] ?? "")}
                        onChange={(e) => updateField(index, field.name, e.target.value)}
                        rows={3}
                      />
                    </div>
                  );
                }
                return (
                  <TextField
                    key={field.name}
                    name={`${field.name}-${index}`}
                    label={field.label}
                    placeholder={field.placeholder}
                    value={String(item.values[field.name] ?? "")}
                    onChange={(e) => updateField(index, field.name, e.target.value)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Button variant="secondary" onClick={addItem} className="mt-4">
        + Add
      </Button>
    </Card>
  );
}
