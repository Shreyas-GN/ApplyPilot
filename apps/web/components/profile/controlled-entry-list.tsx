"use client";

import { Button } from "@/components/ui/button";
import { TextField, TextAreaField } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import type { FieldConfig, ItemValues } from "./repeatable-section";

const LOW_CONFIDENCE_THRESHOLD = 0.6;

export interface ControlledEntry {
  values: ItemValues;
  source: "user" | "ai";
  confidence: number | null;
}

interface ControlledEntryListProps {
  fields: FieldConfig[];
  items: ControlledEntry[];
  onChange: (items: ControlledEntry[]) => void;
  emptyLabel: string;
  blankValues: ItemValues;
}

// Parsing-review counterpart to RepeatableSection: purely controlled (no
// API call of its own) because the review page saves everything — personal
// info plus every section — in one PATCH to match the backend's single
// resume-parsed-data payload, unlike the profile page's per-section PUT
// endpoints that RepeatableSection calls directly.
export function ControlledEntryList({
  fields,
  items,
  onChange,
  emptyLabel,
  blankValues,
}: ControlledEntryListProps) {
  function updateField(index: number, name: string, value: string | boolean) {
    onChange(
      items.map((item, i) =>
        i === index
          ? { ...item, values: { ...item.values, [name]: value }, source: "user", confidence: 1 }
          : item,
      ),
    );
  }

  function addItem() {
    onChange([...items, { values: blankValues, source: "user", confidence: 1 }]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div>
      {items.length === 0 && <p className="mb-3 text-sm text-ui-muted">{emptyLabel}</p>}
      <div className="flex flex-col gap-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border border-ui-border p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {item.source === "ai" && <Badge>AI-suggested</Badge>}
                {item.source === "ai" &&
                  (item.confidence === null || item.confidence < LOW_CONFIDENCE_THRESHOLD) && (
                    <span className="text-xs font-medium text-amber-700">
                      Low confidence — please verify
                    </span>
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
                    <label key={field.name} className="flex items-center gap-2 text-sm text-ui-ink">
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
    </div>
  );
}
