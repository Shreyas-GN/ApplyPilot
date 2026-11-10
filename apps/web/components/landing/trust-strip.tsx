"use client";

import { FolderKanban, Compass, ListChecks, ShieldCheck, Zap } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: FolderKanban,
    title: "Centralized Profile",
    text: "Experience, portfolio, and resumes synchronized in one structured home.",
  },
  {
    icon: Compass,
    title: "Fit Transparency",
    text: "See verified requirement match reasoning before deciding to apply.",
  },
  {
    icon: ListChecks,
    title: "Zero Blind Applies",
    text: "Keep applications organised with mandatory candidate approval on every step.",
  },
];

const PLATFORMS = [
  "Greenhouse",
  "Lever",
  "Workday",
  "Ashby",
  "LinkedIn",
  "SmartRecruiters",
];

export function TrustStrip() {
  return (
    <section className="border-y border-ap-line bg-ap-paper-deep/80">
      <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10">
        <div className="grid gap-6 sm:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group flex items-start gap-3.5 rounded-card p-3 transition-colors duration-150 hover:bg-ap-surface/60"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-ap-line bg-ap-surface text-ap-ink shadow-2xs group-hover:border-ap-vermilion/40 transition-colors">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div>
                <p className="font-ui text-sm font-semibold text-ap-ink">{title}</p>
                <p className="mt-1 font-ui text-[13px] leading-relaxed text-ap-body">{text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ATS compatibility badge row */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-ap-line/70 pt-6">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ap-muted">
            <Zap className="h-3.5 w-3.5 text-ap-vermilion" />
            <span>Built for modern ATS pipelines:</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {PLATFORMS.map((platform) => (
              <span
                key={platform}
                className="font-ui text-xs font-medium text-ap-muted/90 transition-colors hover:text-ap-ink"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
