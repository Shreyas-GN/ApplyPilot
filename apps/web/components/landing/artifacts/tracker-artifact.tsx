import { ListChecks } from "lucide-react";
import { ProductWindow, StatusDot } from "../product-window";
import { PreviewBadge } from "../preview-badge";
import { sampleOpportunity } from "../sample-data";

/**
 * Artifact 5 — Application tracker. Compact timeline / status board.
 * Tracking + automatic status detection are not implemented yet —
 * "Product preview". PRODUCT_EXHIBITION.md §7, §10.
 */
const rows: Array<{ role: string; company: string; date: string; status: string; tone: "sage" | "vermilion" | "neutral" }> = [
  { role: sampleOpportunity.role, company: sampleOpportunity.company, date: "Nov 3", status: "Interview", tone: "sage" },
  { role: "Platform Engineer", company: "Rivermark Labs", date: "Oct 29", status: "Applied", tone: "neutral" },
  { role: "Software Engineer, APIs", company: "Coastline Data", date: "Oct 21", status: "Needs update", tone: "vermilion" },
];

export function TrackerArtifact({ compact = false }: { compact?: boolean }) {
  return (
    <ProductWindow title="Application tracker" icon={ListChecks} badge={<PreviewBadge label="Product preview" />}>
      <ul className="divide-y divide-ap-line">
        {rows.slice(0, compact ? 2 : 3).map((row) => (
          <li key={`${row.company}-${row.role}`} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate font-ui text-sm text-ap-ink">{row.role}</p>
              <p className="mt-0.5 font-ui text-[13px] text-ap-muted">{row.company}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="font-mono text-[11px] text-ap-muted">{row.date}</span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-ui text-[12px] font-medium text-ap-body">
                <StatusDot tone={row.tone} />
                {row.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </ProductWindow>
  );
}
