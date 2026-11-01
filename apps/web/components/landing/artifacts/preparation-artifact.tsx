import { FileEdit } from "lucide-react";
import { ProductWindow } from "../product-window";
import { PreviewBadge } from "../preview-badge";

/**
 * Artifact 4 — Application preparation. Side-by-side document comparison.
 * Tailoring/cover-letter generation is not implemented yet — "Product preview".
 * Never implies the system changes or submits anything without approval.
 * PRODUCT_EXHIBITION.md §6, §10.
 */
export function PreparationArtifact({ compact = false }: { compact?: boolean }) {
  return (
    <ProductWindow title="Application preparation" icon={FileEdit} badge={<PreviewBadge label="Product preview" />}>
      <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-2"}`}>
        <div className="rounded-card border border-ap-line bg-ap-surface-muted p-3">
          <p className="text-[11px] uppercase tracking-wide text-ap-muted">Original</p>
          <p className="mt-2 font-ui text-[13px] leading-relaxed text-ap-body">
            Built REST APIs using Python and FastAPI for internal tooling.
          </p>
        </div>
        {!compact && (
          <div className="rounded-card border border-ap-vermilion-soft bg-ap-vermilion-soft/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-ap-vermilion">Suggested</p>
            <p className="mt-2 font-ui text-[13px] leading-relaxed text-ap-body">
              Designed and shipped REST APIs in Python/FastAPI, backed by PostgreSQL, for internal
              tooling.
            </p>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 font-ui text-[13px] text-ap-body">
        <span className="font-medium text-ap-ink">Change summary:</span>
        <span>surfaces the PostgreSQL experience already on your profile.</span>
      </div>
    </ProductWindow>
  );
}
