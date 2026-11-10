"use client";

import { useState } from "react";
import { UserRound, Search, Scale, FileEdit, ListChecks, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    blurb: "Your experience, skills and résumé brought into one structured profile that you control.",
    badge: "ATS Parse Verified",
    Artifact: ProfileArtifact,
  },
  {
    id: "opportunities",
    label: "Opportunities",
    icon: Search,
    blurb: "Roles compared with enough context, salary signals and team requirements to judge fit at a glance.",
    badge: "Structured Ingestion",
    Artifact: DiscoveryArtifact,
  },
  {
    id: "fit",
    label: "Fit",
    icon: Scale,
    blurb: "Evidence for and against a role, grounded in your actual profile — transparent reasoning, not black-box hype.",
    badge: "Explainable Alignment",
    Artifact: MatchArtifact,
  },
  {
    id: "preparation",
    label: "Preparation",
    icon: FileEdit,
    blurb: "Suggested resume bullet updates and tailored letters shown side-by-side, approved only by you before submitting.",
    badge: "Side-by-Side Diff",
    Artifact: PreparationArtifact,
  },
  {
    id: "tracking",
    label: "Tracking",
    icon: ListChecks,
    blurb: "Every application's status, interview timeline, and next required action organized in one unified board.",
    badge: "Pipeline Sync",
    Artifact: TrackerArtifact,
  },
] as const;

export function ProductShowcase() {
  const [activeId, setActiveId] = useState<(typeof TABS)[number]["id"]>("profile");
  const active = TABS.find((tab) => tab.id === activeId) ?? TABS[0];

  return (
    <section id="product" className="relative bg-ap-paper-deep py-16 sm:py-24 lg:py-28 overflow-hidden">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="max-w-xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-ap-vermilion font-semibold">
            The Product
          </p>
          <h2 className="mt-3 font-display text-[32px] leading-[1.1] text-ap-ink sm:text-[40px]">
            One workspace, from profile to progress.
          </h2>
          <p className="mt-3 font-ui text-[15px] text-ap-body">
            Explore every stage of the candidate copilot below.
          </p>
        </div>

        {/* Tab Header with animated gliding pill */}
        <div
          role="tablist"
          aria-label="Product areas"
          className="mt-10 flex flex-wrap items-center gap-1.5 border-b border-ap-line/80 pb-px"
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
                className={`relative inline-flex items-center gap-2 rounded-t-lg px-4 py-3 font-ui text-sm font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-vermilion ${
                  isActive ? "text-ap-ink font-semibold" : "text-ap-muted hover:text-ap-ink"
                }`}
              >
                <tab.icon className="h-4 w-4 relative z-10" strokeWidth={1.75} aria-hidden="true" />
                <span className="relative z-10">{tab.label}</span>

                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 z-0 rounded-t-lg border-b-2 border-ap-vermilion bg-ap-surface shadow-xs"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Animated Tab Panel */}
        <div
          role="tabpanel"
          id={`panel-${active.id}`}
          aria-labelledby={`tab-${active.id}`}
          className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-center lg:gap-14"
        >
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-ap-line bg-ap-surface px-3 py-1 font-mono text-[11px] font-medium text-ap-muted">
              <Sparkles className="h-3 w-3 text-ap-vermilion" />
              {active.badge}
            </div>
            <p className="mt-4 font-ui text-[16px] leading-relaxed text-ap-ink">
              {active.blurb}
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-mono text-ap-muted">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-ap-sage" />
              Fully customizable in candidate settings
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full"
            >
              <active.Artifact />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
