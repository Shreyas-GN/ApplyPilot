const STATUS_TONE: Record<string, string> = {
  uploaded: "bg-ui-linen text-ui-ink border-ui-border",
  extracting: "bg-blue-50 text-blue-700 border-blue-200/80",
  extracted: "bg-blue-50 text-blue-700 border-blue-200/80",
  parsing: "bg-blue-50 text-blue-700 border-blue-200/80",
  parsed: "bg-amber-50 text-amber-800 border-amber-200/80",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  pending_review: "bg-amber-50 text-amber-800 border-amber-200/80",
  failed: "bg-red-50 text-red-700 border-red-200/80",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  queued: "bg-ui-linen text-ui-body border-ui-border",
  processing: "bg-blue-50 text-blue-700 border-blue-200/80",
  saved: "bg-ui-linen text-ui-ink border-ui-border",
  preparing: "bg-violet-50 text-violet-700 border-violet-200/80",
  ready_to_apply: "bg-teal-50 text-teal-700 border-teal-200/80",
  applied: "bg-blue-50 text-blue-700 border-blue-200/80",
  interviewing: "bg-amber-50 text-amber-800 border-amber-200/80",
  offer: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  rejected: "bg-red-50 text-red-700 border-red-200/80",
  withdrawn: "bg-slate-100 text-slate-500 border-slate-200/80",
};

const STATUS_LABEL: Record<string, string> = {
  uploaded: "Uploaded",
  extracting: "Extracting text",
  extracted: "Text extracted",
  parsing: "AI parsing",
  parsed: "Ready for review",
  confirmed: "Confirmed",
  pending_review: "Needs review",
  failed: "Failed",
  completed: "Completed",
  queued: "Queued",
  processing: "Processing",
  saved: "Saved",
  preparing: "Preparing",
  ready_to_apply: "Ready to Apply",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offered",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "bg-ui-linen text-ui-body border-ui-border";
  const label = STATUS_LABEL[status] ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

export function Badge({
  children,
  tone = "lilac",
  className = "",
}: {
  children: string;
  tone?: "lilac" | "neutral" | "success" | "warning";
  className?: string;
}) {
  const toneClass =
    tone === "neutral"
      ? "bg-ui-linen text-ui-body border-ui-border"
      : tone === "success"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
        : tone === "warning"
          ? "bg-amber-50 text-amber-800 border-amber-200/80"
          : "bg-ui-lilac-soft text-ui-violet border-ui-lilac";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClass} ${className}`}
    >
      {children}
    </span>
  );
}
