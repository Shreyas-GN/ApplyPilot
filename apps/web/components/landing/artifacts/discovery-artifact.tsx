import { Search, MapPin } from "lucide-react";
import { ProductWindow, Tag, StatusDot } from "../product-window";
import { PreviewBadge } from "../preview-badge";
import { sampleOpportunityList } from "../sample-data";

/**
 * Artifact 2 — Opportunity discovery. Broad list with one selected role.
 * Job discovery is not implemented yet — always "Product preview".
 * docs/design/PRODUCT_EXHIBITION.md §4, §10.
 */
export function DiscoveryArtifact({ compact = false }: { compact?: boolean }) {
  return (
    <ProductWindow title="Opportunities" icon={Search} badge={<PreviewBadge label="Product preview" />}>
      <ul className="divide-y divide-ap-line">
        {sampleOpportunityList.slice(0, compact ? 2 : 3).map((item) => (
          <li
            key={`${item.company}-${item.role}`}
            className={`flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 ${
              item.selected ? "" : "opacity-70"
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {item.selected && <StatusDot tone="vermilion" />}
                <p className="truncate font-ui text-sm font-medium text-ap-ink">{item.role}</p>
              </div>
              <p className="mt-0.5 flex items-center gap-1 font-ui text-[13px] text-ap-muted">
                {item.company}
                <span aria-hidden="true">·</span>
                <MapPin className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                {item.location}
              </p>
            </div>
            <div className="hidden flex-shrink-0 gap-1.5 sm:flex">
              {item.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {!compact && (
        <p className="mt-3 font-mono text-[11px] text-ap-muted">Illustrative opportunity list — not live listings.</p>
      )}
    </ProductWindow>
  );
}
