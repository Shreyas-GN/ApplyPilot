"use client";

import Link from "next/link";
import type { ProfileDto } from "@/lib/types";

interface OverviewProps {
  profile: ProfileDto;
  refreshing?: boolean;
}

export function ProfileIntelligenceOverview({
  profile,
  refreshing = false,
}: OverviewProps) {
  const intel = profile.intelligence;
  const confirmedPercent = intel?.confirmedPercent ?? profile.completionPercent;
  const totalWithAiPercent = intel?.totalWithAiPercent ?? confirmedPercent;
  const unverifiedAiCount = intel?.unverifiedAiCount ?? 0;
  const sections = intel?.sections ?? [];
  const suggestions = intel?.suggestions ?? [];
  const aiPendingHeadroom = Math.max(0, totalWithAiPercent - confirmedPercent);

  function jumpToSection(sectionId: string) {
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[14px] border border-ui-border bg-ui-surface p-5 shadow-[0_1px_2px_rgba(30,25,21,0.04)] sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ui-muted">
                Candidate Intelligence Profile
              </span>
              {refreshing && (
                <span className="rounded-full bg-ui-linen px-2 py-0.5 font-mono text-[11px] text-ui-muted">
                  Syncing…
                </span>
              )}
            </div>
            <h1 className="font-display text-[28px] leading-[1.15] tracking-[-0.02em] text-ui-ink sm:text-[32px]">
              {profile.fullName?.trim()
                ? `${profile.fullName}'s Career Dossier`
                : "Your Candidate Intelligence Profile"}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-ui-muted">
              Nine structured sections power resume tailoring, job match scoring, and application autofill. Only user-confirmed facts count toward verified qualifications.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href="/resumes"
              className="inline-flex h-9 items-center justify-center rounded-full border border-ui-border bg-ui-linen px-4 text-xs font-medium text-ui-ink transition hover:bg-ui-linen"
            >
              Upload / Parse Resume
            </Link>
            <Link
              href="/studio"
              className="inline-flex h-9 items-center justify-center rounded-full bg-ui-wine px-4 text-xs font-medium text-ap-surface transition hover:bg-ap-body"
            >
              Open Tailoring Studio
            </Link>
          </div>
        </div>

        {/* Completeness meter */}
        <div className="mt-5 rounded-xl border border-ui-border bg-ui-linen/50 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-mono text-2xl font-semibold text-ui-ink">
                {confirmedPercent}%
              </span>
              <span className="text-sm font-medium text-ui-body">
                Confirmed profile completeness
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-ap-sage" />
                User-confirmed: {intel?.confirmedItemCount ?? 0} entries
              </span>
              {unverifiedAiCount > 0 && (
                <span className="inline-flex items-center gap-1.5 font-medium text-ui-ink">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  {unverifiedAiCount} AI-extracted pending review (+{aiPendingHeadroom}%)
                </span>
              )}
            </div>
          </div>

          <div
            className="mt-2.5 flex h-2.5 w-full overflow-hidden rounded-full bg-ui-linen"
            role="progressbar"
            aria-valuenow={confirmedPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Confirmed profile completeness"
          >
            <div
              className="h-full bg-ap-sage transition-all duration-300"
              style={{ width: `${confirmedPercent}%` }}
            />
            {aiPendingHeadroom > 0 && (
              <div
                className="h-full bg-amber-300/80 transition-all duration-300"
                style={{ width: `${aiPendingHeadroom}%` }}
                title="Unverified AI-extracted headroom"
              />
            )}
          </div>

          {sections.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sections.map((section, idx) => {
                const badgeStyle = section.complete
                  ? "border-ap-sage/30 bg-emerald-50 text-emerald-700"
                  : section.aiUnverifiedCount > 0
                    ? "border-amber-300 bg-ap-butter text-ui-ink"
                    : "border-ui-border bg-ui-surface text-ui-muted hover:text-ui-ink";
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => jumpToSection(section.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${badgeStyle}`}
                  >
                    <span className="font-mono text-[10px] opacity-75">
                      0{idx + 1}
                    </span>
                    <span>{section.label}</span>
                    {section.complete ? (
                      <span aria-hidden="true">✓</span>
                    ) : section.aiUnverifiedCount > 0 ? (
                      <span className="font-mono text-[10px]">
                        AI({section.aiUnverifiedCount})
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actionable suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ui-muted">
                Actionable Next Steps
              </span>
              <span className="text-xs text-ui-muted">
                {suggestions.length} recommendation{suggestions.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.slice(0, 3).map((sug) => {
                const priorityStyle =
                  sug.priority === "high"
                    ? "border-ap-vermilion/30 bg-ui-lilac-soft/40"
                    : "border-ui-border bg-ui-linen/40";
                return (
                  <div
                    key={sug.id}
                    className={`flex flex-col justify-between gap-2 rounded-xl border p-3 ${priorityStyle}`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-ui-ink">
                        {sug.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-ui-muted">
                        {sug.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => jumpToSection(sug.sectionId)}
                      className="self-start text-xs font-medium text-ui-violet hover:underline"
                    >
                      {sug.actionLabel} →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

