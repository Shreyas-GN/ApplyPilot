import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-ui-border bg-ui-surface p-6 ${
        interactive ? "transition-colors duration-150 hover:border-ui-muted/60" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ui-muted">
            {eyebrow}
          </p>
        )}
        <h2 className="text-[17px] font-semibold tracking-[-0.014em] text-ui-ink">{title}</h2>
        {description && <p className="mt-1 text-sm leading-relaxed text-ui-body">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "accent" | "success" | "warning";
}) {
  const dotColor =
    tone === "accent"
      ? "bg-ui-violet"
      : tone === "success"
        ? "bg-emerald-600"
        : tone === "warning"
          ? "bg-amber-600"
          : "bg-ui-muted";

  return (
    <div className="rounded-2xl border border-ui-border bg-ui-surface p-5">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ui-muted">
          {label}
        </span>
      </div>
      <p className="mt-2.5 text-3xl font-semibold tracking-[-0.025em] text-ui-ink tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ui-body">{hint}</p>}
    </div>
  );
}
