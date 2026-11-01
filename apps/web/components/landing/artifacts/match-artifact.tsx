import { Scale, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { ProductWindow } from "../product-window";
import { PreviewBadge } from "../preview-badge";
import { sampleOpportunity } from "../sample-data";

/**
 * Artifact 3 — Match explanation. Evidence-led split panel.
 * Shows evidence, never a bare percentage. Explainable matching is not
 * implemented yet — always "Product preview". PRODUCT_EXHIBITION.md §5, §10.
 */
export function MatchArtifact({ compact = false }: { compact?: boolean }) {
  return (
    <ProductWindow title="Why this fits" icon={Scale} badge={<PreviewBadge label="Product preview" />}>
      <p className="font-ui text-sm font-medium text-ap-ink">
        {sampleOpportunity.role} · {sampleOpportunity.company}
      </p>
      <p className="mt-1 font-ui text-[13px] text-ap-body">
        Strong overlap with your profile on core backend skills; two requirements aren&apos;t yet
        demonstrated.
      </p>

      <ul className="mt-4 space-y-2.5">
        <li className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-ap-sage" strokeWidth={1.75} aria-hidden="true" />
          <div className="font-ui text-[13px] text-ap-body">
            <span className="font-medium text-ap-ink">Strong alignment —</span> Python, API
            development
          </div>
        </li>
        {!compact && (
          <li className="flex items-start gap-2.5">
            <AlertCircle
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-ap-vermilion"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <div className="font-ui text-[13px] text-ap-body">
              <span className="font-medium text-ap-ink">Needs attention —</span> relational
              database depth not shown on your profile
            </div>
          </li>
        )}
        <li className="flex items-start gap-2.5">
          <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-ap-muted" strokeWidth={1.75} aria-hidden="true" />
          <div className="font-ui text-[13px] text-ap-body">
            <span className="font-medium text-ap-ink">Not enough information —</span> on-call or
            production-incident experience
          </div>
        </li>
      </ul>
    </ProductWindow>
  );
}
