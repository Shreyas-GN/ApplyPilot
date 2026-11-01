import { Sparkles, FlaskConical } from "lucide-react";

type PreviewBadgeProps = {
  label: "Product preview" | "In development" | "Coming next" | "Illustrative sample";
  className?: string;
};

/**
 * Capability-truth labeling, per docs/design/PRODUCT_EXHIBITION.md §10 and
 * docs/design/LANDING_PAGE.md §4D. Every non-live mockup on the page carries
 * one of these so nothing implies a capability that doesn't exist yet.
 */
export function PreviewBadge({ label, className = "" }: PreviewBadgeProps) {
  const Icon = label === "Illustrative sample" ? Sparkles : FlaskConical;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-ap-line bg-ap-surface px-2.5 py-1 font-ui text-[11px] font-medium tracking-wide text-ap-muted ${className}`}
    >
      <Icon className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
      {label}
    </span>
  );
}
