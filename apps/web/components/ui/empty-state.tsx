import type { ComponentType, ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ui-border bg-ui-surface/60 px-6 py-12 text-center">
      {Icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-ui-border bg-ui-surface text-ui-muted">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-ui-ink">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ui-body">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

