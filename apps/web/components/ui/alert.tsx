import type { ReactNode } from "react";

const TONE_CLASSES: Record<string, string> = {
  error: "bg-red-50 text-red-800 border-red-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  info: "bg-ui-lilac-soft text-ui-ink border-ui-lilac",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
};

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "error" | "success" | "info" | "warning";
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${TONE_CLASSES[tone]}`}
    >
      {children}
    </div>
  );
}
