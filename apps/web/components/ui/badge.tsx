const STATUS_TONE: Record<string, string> = {
  uploaded: "bg-slate-100 text-slate-700",
  extracting: "bg-blue-100 text-blue-700",
  extracted: "bg-blue-100 text-blue-700",
  parsing: "bg-blue-100 text-blue-700",
  parsed: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-700",
  pending_review: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-700",
  completed: "bg-emerald-100 text-emerald-700",
  queued: "bg-slate-100 text-slate-700",
  processing: "bg-blue-100 text-blue-700",
  saved: "bg-slate-100 text-slate-700",
  applied: "bg-blue-100 text-blue-700",
  interviewing: "bg-amber-100 text-amber-800",
  offer: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
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
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "bg-slate-100 text-slate-700";
  const label = STATUS_LABEL[status] ?? status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {label}
    </span>
  );
}

export function Badge({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 ${className}`}
    >
      {children}
    </span>
  );
}
