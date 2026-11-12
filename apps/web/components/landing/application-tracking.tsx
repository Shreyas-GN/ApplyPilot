"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, FileText, ListChecks } from "lucide-react";
import {
  samplePipelineApplications,
  samplePipelineCounts,
  type PipelineStage,
} from "./sample-data";

const HIGHLIGHTS = [
  "Track saved and applied opportunities.",
  "Link the resume version used for each application.",
  "Record interview stages.",
  "Keep company and recruiter notes.",
  "Manage follow-up reminders.",
  "Review your application history.",
];

const STAGES: PipelineStage[] = ["Saved", "Applied", "Interview", "Offers"];

const STAGE_BADGE: Record<PipelineStage, string> = {
  Saved: "bg-gray-100 text-gray-700",
  Applied: "bg-blue-50 text-blue-700",
  Interview: "bg-amber-50 text-amber-800",
  Offers: "bg-emerald-50 text-emerald-700",
};

export function ApplicationTracking() {
  const [filterStage, setFilterStage] = useState<PipelineStage | "All">("All");
  const [apps, setApps] = useState(samplePipelineApplications);

  const visibleApps =
    filterStage === "All" ? apps : apps.filter((item) => item.stage === filterStage);

  function advanceStage(id: string) {
    setApps((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextIndex = (STAGES.indexOf(item.stage) + 1) % STAGES.length;
        return { ...item, stage: STAGES[nextIndex]! };
      })
    );
  }

  return (
    <section id="tracking" className="border-b border-lp-border bg-lp-surface py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* Header & Highlights */}
        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-16">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-lp-accent">
              Keep every opportunity in sight
            </p>
            <h2 className="mt-3 font-ui text-[32px] font-semibold leading-[1.12] tracking-[-0.02em] text-lp-ink sm:text-[42px]">
              Know where every application stands.
            </h2>
            <p className="mt-4 font-ui text-[16px] leading-[1.65] text-lp-body">
              From the moment you decide to apply to the day you receive an update, keep your job
              search organized in one place.
            </p>
          </div>

          <ul className="grid gap-2.5 sm:grid-cols-2">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-2 font-ui text-[13px] text-lp-ink">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-lp-accent" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Full-Width Pipeline Dashboard Preview */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-lp-border bg-lp-bg shadow-[0_1px_3px_rgba(17,24,39,0.04),0_20px_48px_rgba(17,24,39,0.08)]">
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lp-border bg-lp-surface-subtle px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-lp-accent" aria-hidden="true" />
              <span className="font-ui text-sm font-semibold text-lp-ink">
                Your application pipeline
              </span>
            </div>
            <span className="rounded-full border border-lp-border bg-lp-bg px-2.5 py-0.5 font-mono text-[11px] text-lp-muted">
              Illustrative dashboard data
            </span>
          </div>

          {/* Stage Counters (Interactive Filter) */}
          <div className="grid grid-cols-2 divide-x divide-y divide-lp-border border-b border-lp-border sm:grid-cols-4 sm:divide-y-0">
            {STAGES.map((stage) => {
              const isSelected = filterStage === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setFilterStage(isSelected ? "All" : stage)}
                  className={`flex flex-col items-start p-5 text-left transition-colors hover:bg-lp-surface-subtle ${
                    isSelected ? "bg-lp-accent-soft/40" : "bg-lp-bg"
                  }`}
                >
                  <span className="font-mono text-xs uppercase tracking-wider text-lp-muted">
                    {stage}
                  </span>
                  <span className="mt-1 font-ui text-3xl font-semibold tracking-tight text-lp-ink">
                    {samplePipelineCounts[stage]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Application Rows */}
          <div className="divide-y divide-lp-border">
            {visibleApps.map((app) => (
              <div
                key={app.id}
                className="flex flex-col justify-between gap-4 px-5 py-4 transition-colors hover:bg-lp-surface-subtle/50 sm:flex-row sm:items-center sm:px-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="font-ui text-sm font-semibold text-lp-ink">{app.role}</p>
                    <span className="font-ui text-xs text-lp-muted">
                      {app.company} · {app.location}
                    </span>
                  </div>
                  <p className="mt-1 font-ui text-xs text-lp-body">{app.note}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:flex-shrink-0">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-lp-border bg-lp-surface-subtle px-2.5 py-1 font-mono text-[11px] text-lp-body">
                    <FileText className="h-3 w-3 text-lp-muted" aria-hidden="true" />
                    {app.resumeVersion}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 font-ui text-xs font-medium ${STAGE_BADGE[app.stage]}`}
                  >
                    {app.stage}
                  </span>
                  <button
                    type="button"
                    onClick={() => advanceStage(app.id)}
                    title="Advance sample stage"
                    className="inline-flex items-center gap-1 rounded-lg border border-lp-border bg-lp-bg px-2.5 py-1 font-ui text-xs font-medium text-lp-body transition-colors hover:border-lp-ink/30 hover:text-lp-ink"
                  >
                    Move stage
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-lp-border bg-lp-surface-subtle px-5 py-3 font-mono text-[11px] text-lp-muted sm:px-6">
            <span>Click any stage card above to filter, or &ldquo;Move stage&rdquo; to preview pipeline transitions.</span>
            {filterStage !== "All" && (
              <button
                type="button"
                onClick={() => setFilterStage("All")}
                className="font-ui text-xs font-medium text-lp-accent hover:underline"
              >
                Show all stages
              </button>
            )}
          </div>
        </div>

        <p className="mt-8 text-center font-ui text-[15px] font-medium text-lp-ink">
          Less time remembering where you applied. More time preparing for what comes next.
        </p>
      </div>
    </section>
  );
}

