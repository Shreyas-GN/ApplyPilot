"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  FileEdit,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { sampleCandidate, sampleOpportunities } from "./sample-data";

const HIGHLIGHTS = [
  "Start with your master career profile.",
  "Understand the requirements of each job.",
  "Highlight relevant skills and projects.",
  "Refine experience descriptions.",
  "Compare original and suggested content.",
  "Review every change before accepting it.",
  "Keep a separate resume version for each application.",
];

export function AdaptiveResume() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [approvedByRole, setApprovedByRole] = useState<Record<string, boolean>>({});
  const current = sampleOpportunities[selectedIdx] ?? sampleOpportunities[0]!;
  const isApproved = Boolean(approvedByRole[current.id]);

  function toggleApprove() {
    setApprovedByRole((prev) => ({
      ...prev,
      [current.id]: !prev[current.id],
    }));
  }

  return (
    <section id="adaptive-resume" className="border-b border-lp-border bg-lp-surface py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* Section Header */}
        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-16">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-lp-accent">
              Every role is different
            </p>
            <h2 className="mt-3 font-ui text-[32px] font-semibold leading-[1.12] tracking-[-0.02em] text-lp-ink sm:text-[42px]">
              One professional profile. A resume tailored to every opportunity.
            </h2>
            <p className="mt-4 font-ui text-[16px] leading-[1.65] text-lp-body">
              Your experience stays the same. How you present it shouldn&apos;t have to.
            </p>
            <p className="mt-2 font-ui text-[15px] leading-[1.65] text-lp-body">
              ApplyPilot helps you adapt your resume to each job description by highlighting
              relevant skills, projects and experience — without starting from scratch every time.
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

        {/* Large Split-Screen Interactive Demonstration */}
        <div className="mt-12 overflow-hidden rounded-[28px] border border-lp-border bg-white shadow-[0_12px_44px_rgba(43,35,32,0.06)]">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-lp-border bg-lp-bg/60 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <FileEdit className="h-4 w-4 text-lp-wine" aria-hidden="true" />
                <span className="font-ui text-sm font-semibold text-lp-ink">
                  Resume comparison
                </span>
              </div>
              <span className="rounded-full border border-lp-border bg-white px-2.5 py-0.5 font-mono text-[11px] text-lp-muted">
                Illustrative preview
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-ui text-xs text-lp-muted">Target job description:</span>
              <div className="inline-flex rounded-full border border-lp-border bg-white p-0.5">
                {sampleOpportunities.map((opp, idx) => (
                  <button
                    key={opp.id}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    className={`rounded-full px-3 py-1 font-ui text-xs font-semibold transition-colors ${selectedIdx === idx
                        ? "bg-[#141413] text-white"
                        : "text-lp-body hover:text-lp-ink"
                      }`}
                  >
                    {opp.role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Context Strip: Master Profile -> Job */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lp-border bg-lp-bg px-5 py-3 font-ui text-xs text-lp-body sm:px-6">
            <div>
              Master profile: <strong className="font-medium text-lp-ink">{sampleCandidate.name}</strong>{" "}
              ({sampleCandidate.skills.slice(0, 4).join(", ")})
            </div>
            <div className="font-mono text-[11px] text-lp-muted">
              Version: <span className="text-lp-ink">{current.resumeVersion}</span>
            </div>
          </div>

          {/* Split-Screen Diff */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid divide-y divide-lp-border md:grid-cols-2 md:divide-x md:divide-y-0"
            >
              {/* Original */}
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-lp-muted">
                    Original
                  </span>
                  <span className="font-ui text-xs text-lp-muted">Master profile entry</span>
                </div>
                <div className="mt-4 rounded-xl border border-lp-border bg-lp-surface-subtle p-5">
                  <p className="font-ui text-sm font-semibold text-lp-ink">
                    {current.originalTitle}
                  </p>
                  <p className="mt-1 font-ui text-xs text-lp-muted">
                    Kaveri Cloud Services · 2023 – Present
                  </p>
                  <p className="mt-3 font-ui text-[15px] leading-relaxed text-lp-body">
                    {current.originalBullet}
                  </p>
                </div>
              </div>

              {/* Tailored */}
              <div className="bg-lp-accent-soft/25 p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-lp-accent">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Tailored
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-ui text-[11px] font-medium ${isApproved
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                      }`}
                  >
                    {isApproved ? "Approved for this application" : "Awaiting your approval"}
                  </span>
                </div>
                <motion.div
                  initial={{ opacity: 0.7, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`mt-4 rounded-xl border p-5 transition-colors ${isApproved
                      ? "border-emerald-300 bg-lp-bg shadow-2xs"
                      : "border-lp-accent/30 bg-lp-bg shadow-2xs"
                    }`}
                >
                  <p className="font-ui text-sm font-semibold text-lp-ink">
                    {current.tailoredTitle}
                  </p>
                  <p className="mt-1 font-ui text-xs text-lp-muted">
                    Kaveri Cloud Services · 2023 – Present
                  </p>
                  <p className="mt-3 font-ui text-[15px] leading-relaxed text-lp-ink">
                    {current.tailoredBullet}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Evidence-Backed & Candidate Approval Bar */}
          <div className="flex flex-col justify-between gap-4 border-t border-lp-border bg-lp-surface-subtle px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-lp-accent" aria-hidden="true" />
              <div className="font-ui text-xs leading-relaxed text-lp-body">
                <span className="font-semibold text-lp-ink">Evidence-backed changes: </span>
                {current.tailoringReason}
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-3">
              <span className="hidden font-ui text-xs text-lp-muted sm:inline">
                You stay in control
              </span>
              <button
                type="button"
                onClick={toggleApprove}
                className={`inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2 font-ui text-xs font-medium transition-colors ${isApproved
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-lp-wine text-white hover:bg-lp-wine-hover"
                  }`}
              >
                {isApproved ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Approved
                  </>
                ) : (
                  <>
                    Approve change
                  </>
                )}
              </button>
              {isApproved && (
                <button
                  type="button"
                  onClick={toggleApprove}
                  aria-label="Revert approval"
                  className="inline-flex items-center gap-1 rounded-lg border border-lp-border bg-lp-bg px-2.5 py-2 font-ui text-xs text-lp-body hover:text-lp-ink"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Microcopy beneath the section */}
        <div className="mt-6 flex flex-col items-center justify-between gap-2 text-center font-ui text-sm sm:flex-row sm:text-left">
          <p className="font-medium text-lp-ink">
            Your experience. Your words. Your approval.
          </p>
          <p className="text-lp-muted">
            Never fabricate skills, achievements or employment history to match a job description.
          </p>
        </div>
      </div>
    </section>
  );
}

