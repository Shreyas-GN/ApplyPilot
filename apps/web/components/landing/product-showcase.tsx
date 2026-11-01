"use client";

import { useState } from "react";
import { UserRound, Search, Scale, FileEdit, ListChecks } from "lucide-react";
import { ProfileArtifact } from "./artifacts/profile-artifact";
import { DiscoveryArtifact } from "./artifacts/discovery-artifact";
import { MatchArtifact } from "./artifacts/match-artifact";
import { PreparationArtifact } from "./artifacts/preparation-artifact";
import { TrackerArtifact } from "./artifacts/tracker-artifact";

const TABS = [
  {
    id: "profile",
    label: "Profile",
    icon: UserRound,
    blurb: "Your experience, skills and résumé brought into one structured profile.",
    Artifact: ProfileArtifact,
  },
  {
    id: "opportunities",
    label: "Opportunities",
    icon: Search,
    blurb: "Roles compared with enough context to judge fit at a glance.",
    Artifact: DiscoveryArtifact,
  },
  {
    id: "fit",
    label: "Fit",
    icon: Scale,
    blurb: "Evidence for and against a role, grounded in your actual profile.",
    Artifact: MatchArtifact,
  },
  {
    id: "preparation",
    label: "Preparation",
    icon: FileEdit,
    blurb: "Suggested changes shown side-by-side, reviewed before you use them.",
    Artifact: PreparationArtifact,
  },
  {
    id: "tracking",
    label: "Tracking",
    icon: ListChecks,
    blurb: "Every application's status and next action, in one list.",
    Artifact: TrackerArtifact,
  },
] as const;

export function ProductShowcase() {
  const [activeId, setActiveId] = useState<(typeof TABS)[number]["id"]>("profile");
  const active = TABS.find((tab) => tab.id === activeId) ?? TABS[0];

  return (
    <section id="product" className="bg-ap-paper-deep py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="max-w-xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-ap-vermilion">The product</p>
          <h2 className="mt-3 font-display text-[32px] leading-[1.1] text-ap-ink sm:text-[40px]">
            One workspace, from profile to progress.
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Product areas"
          className="mt-10 flex flex-wrap gap-2 border-b border-ap-line pb-px"
        >
          {TABS.map((tab) => {
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveId(tab.id)}
                className={`inline-flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-3 font-ui text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "border-ap-vermilion text-ap-ink"
                    : "border-transparent text-ap-muted hover:text-ap-ink"
                }`}
              >
                <tab.icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`panel-${active.id}`}
          aria-labelledby={`tab-${active.id}`}
          className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-center lg:gap-16"
        >
          <p className="max-w-sm font-ui text-[15px] leading-relaxed text-ap-body">{active.blurb}</p>
          <active.Artifact />
        </div>
      </div>
    </section>
  );
}
