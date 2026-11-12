"use client";

import { useState } from "react";
import { UserRound, Search, FileEdit, ListChecks, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PILLARS = [
  {
    id: "understand",
    number: "01",
    title: "Understand yourself",
    description: "One structured profile built around your experience, skills and projects.",
    icon: UserRound,
    previewTitle: "Structured Career Profile",
    previewItems: [
      "Parsed from your existing PDF or DOCX resume",
      "Skills, work history, education, and projects organized cleanly",
      "Every extracted field reviewed and confirmed by you",
    ],
  },
  {
    id: "fit",
    number: "02",
    title: "Find your fit",
    description: "Discover opportunities with transparent matching explanations.",
    icon: Search,
    previewTitle: "Evidence-Led Opportunity Matching",
    previewItems: [
      "Required vs. preferred qualifications broken down clearly",
      "Matching skills linked directly to your profile evidence",
      "Missing or unverified requirements surfaced upfront",
    ],
  },
  {
    id: "prepare",
    number: "03",
    title: "Prepare deliberately",
    description: "Create job-specific application materials using your existing experience.",
    icon: FileEdit,
    previewTitle: "Adaptive Resume Engine",
    previewItems: [
      "Tailored resume bullets grounded in your verified history",
      "Side-by-side comparison between original and suggested text",
      "Dedicated resume version saved for each application",
    ],
  },
  {
    id: "organize",
    number: "04",
    title: "Stay organized",
    description: "Keep applications, resume versions and interview progress together.",
    icon: ListChecks,
    previewTitle: "Unified Application Pipeline",
    previewItems: [
      "Track Saved, Applied, Interview, and Offer stages in one view",
      "Know exactly which resume version was sent to each company",
      "Keep recruiter notes and follow-up reminders connected",
    ],
  },
] as const;

export function WorkspaceIntro() {
  const [activeId, setActiveId] = useState<(typeof PILLARS)[number]["id"]>("understand");
  const active = PILLARS.find((p) => p.id === activeId) ?? PILLARS[0];

  return (
    <section id="how-it-works" className="border-b border-lp-border bg-lp-bg py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="mx-auto max-w-[700px] text-center">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-lp-accent">
            Introducing ApplyPilot
          </p>
          <h2 className="mt-3 font-ui text-[32px] font-semibold leading-[1.12] tracking-[-0.02em] text-lp-ink sm:text-[42px]">
            Everything behind your next opportunity, connected.
          </h2>
          <p className="mt-4 font-ui text-[16px] leading-[1.65] text-lp-body sm:text-[17px]">
            ApplyPilot brings your professional profile, job opportunities, application preparation
            and progress into one organized experience.
          </p>
        </div>

        {/* Interactive 4-Pillar Connected Workspace */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar) => {
            const isActive = pillar.id === activeId;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setActiveId(pillar.id)}
                className={`group flex flex-col rounded-xl border p-5 text-left transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent ${
                  isActive
                    ? "border-lp-wine bg-lp-wine text-white shadow-sm"
                    : "border-lp-border bg-lp-bg text-lp-ink hover:border-lp-muted/50 hover:bg-lp-surface-subtle"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={`font-mono text-xs font-medium ${
                      isActive ? "text-lp-accent-soft" : "text-lp-muted"
                    }`}
                  >
                    {pillar.number}.
                  </span>
                  <pillar.icon
                    className={`h-4 w-4 ${isActive ? "text-[#d8cefe]" : "text-lp-muted group-hover:text-lp-ink"}`}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-4 font-ui text-base font-semibold">{pillar.title}</h3>
                <p
                  className={`mt-1.5 font-ui text-sm leading-relaxed ${
                    isActive ? "text-gray-300" : "text-lp-body"
                  }`}
                >
                  {pillar.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Full-width connected detail panel */}
        <div className="mt-6 rounded-2xl border border-lp-border bg-lp-surface-subtle p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="grid items-center gap-6 lg:grid-cols-[1fr_1.4fr]"
            >
              <div>
                <span className="font-mono text-xs font-medium text-lp-accent">
                  Stage {active.number}
                </span>
                <h3 className="mt-1 font-ui text-xl font-semibold text-lp-ink">
                  {active.previewTitle}
                </h3>
                <p className="mt-2 font-ui text-sm leading-relaxed text-lp-body">
                  {active.description}
                </p>
              </div>
              <ul className="grid gap-3 sm:grid-cols-3">
                {active.previewItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 rounded-xl border border-lp-border bg-lp-bg p-4 font-ui text-[13px] leading-relaxed text-lp-ink"
                  >
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-lp-accent" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

