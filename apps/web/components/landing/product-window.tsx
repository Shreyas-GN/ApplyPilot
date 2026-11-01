import type { ComponentType, ReactNode } from "react";

type ProductWindowProps = {
  title: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Shared chrome for every product artifact mockup: a clean titled panel,
 * never fake browser chrome. docs/design/DESIGN.md §6 "Product panels".
 */
export function ProductWindow({ title, icon: Icon, badge, children, className = "" }: ProductWindowProps) {
  return (
    <div
      className={`rounded-window border border-ap-line bg-ap-surface shadow-[0_1px_2px_rgba(37,40,32,0.05),0_12px_32px_rgba(37,40,32,0.07)] ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-ap-line px-5 py-3.5">
        <div className="flex items-center gap-2 text-ap-ink">
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden={true} />
          <span className="font-ui text-sm font-medium">{title}</span>
        </div>
        {badge}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "sage" | "vermilion" }) {
  const toneClasses =
    tone === "sage"
      ? "border-transparent bg-ap-sage-soft text-ap-sage"
      : tone === "vermilion"
        ? "border-transparent bg-ap-vermilion-soft text-ap-vermilion"
        : "border-ap-line bg-ap-surface-muted text-ap-body";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-ui text-[12px] font-medium ${toneClasses}`}
    >
      {children}
    </span>
  );
}

export function StatusDot({ tone = "neutral" }: { tone?: "neutral" | "sage" | "vermilion" }) {
  const color =
    tone === "sage" ? "bg-ap-sage" : tone === "vermilion" ? "bg-ap-vermilion" : "bg-ap-muted";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} aria-hidden="true" />;
}
