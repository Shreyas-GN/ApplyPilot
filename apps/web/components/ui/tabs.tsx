"use client";

import type { ComponentType } from "react";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
  icon?: ComponentType<{ className?: string }>;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel = "Tabs",
  className = "",
}: {
  items: Array<TabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex flex-wrap items-center gap-1 rounded-xl border border-ui-border bg-ui-surface p-1 ${className}`}
    >
      {items.map((item) => {
        const active = item.id === value;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-violet ${
              active
                ? "bg-ui-lilac-soft text-ui-ink"
                : "text-ui-body hover:bg-ui-linen/60 hover:text-ui-ink"
            }`}
          >
            {Icon && (
              <Icon
                className={`h-4 w-4 ${active ? "text-ui-violet" : "text-ui-muted"}`}
                aria-hidden="true"
              />
            )}
            <span>{item.label}</span>
            {typeof item.count === "number" && (
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[11px] tabular-nums ${
                  active ? "bg-ui-surface text-ui-ink" : "bg-ui-linen text-ui-muted"
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

