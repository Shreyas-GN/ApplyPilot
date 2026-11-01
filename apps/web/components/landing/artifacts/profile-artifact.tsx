import { UserRound, FileCheck2 } from "lucide-react";
import { ProductWindow, Tag } from "../product-window";
import { PreviewBadge } from "../preview-badge";
import { sampleCandidate } from "../sample-data";

/**
 * Artifact 1 — Candidate profile. Close-up, document-like panel.
 * This reflects a genuinely implemented capability (profile + resume
 * parsing review), so it is labeled "Illustrative sample" rather than
 * "Product preview" — see docs/design/PRODUCT_EXHIBITION.md §3, §10.
 */
export function ProfileArtifact({ compact = false }: { compact?: boolean }) {
  return (
    <ProductWindow title="Candidate profile" icon={UserRound} badge={<PreviewBadge label="Illustrative sample" />}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-xl text-ap-ink">{sampleCandidate.name}</p>
          <p className="mt-1 font-ui text-sm text-ap-body">{sampleCandidate.targetRole}</p>
        </div>
        <span className="whitespace-nowrap rounded-full bg-ap-sage-soft px-2.5 py-1 font-ui text-[11px] font-medium text-ap-sage">
          Profile 80% complete
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-ap-line py-3 font-ui text-sm">
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-ap-muted">Location preference</dt>
          <dd className="mt-0.5 text-ap-body">{sampleCandidate.location}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-ap-muted">Experience</dt>
          <dd className="mt-0.5 text-ap-body">{sampleCandidate.experienceLevel}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <p className="text-[11px] uppercase tracking-wide text-ap-muted">Skills</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {sampleCandidate.skills.map((skill) => (
            <Tag key={skill}>{skill}</Tag>
          ))}
        </div>
      </div>

      {!compact && (
        <div className="mt-4 flex items-center gap-2 rounded-card border border-ap-line bg-ap-surface-muted px-3 py-2.5">
          <FileCheck2 className="h-4 w-4 flex-shrink-0 text-ap-sage" strokeWidth={1.75} aria-hidden="true" />
          <p className="font-ui text-[13px] text-ap-body">
            Parsed from résumé — <span className="text-ap-ink">reviewed and confirmed</span>
          </p>
        </div>
      )}
    </ProductWindow>
  );
}
