"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Layers,
  MapPin,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { sampleCandidate, sampleOpportunities } from "./sample-data";

export function Hero() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = sampleOpportunities[selectedIdx] ?? sampleOpportunities[0]!;

  return (
    <section className="relative overflow-hidden border-b border-lp-border bg-lp-bg pt-14 pb-20 sm:pt-20 sm:pb-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* Centered Hero Header */}
        <div className="mx-auto max-w-[780px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-flex items-center gap-2 rounded-full border border-lp-border bg-lp-surface-subtle px-3.5 py-1 font-ui text-xs font-medium text-lp-body"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-lp-accent" aria-hidden="true" />
            A more considered way to find your next role
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="mt-6 font-ui text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] text-lp-ink sm:text-[54px] lg:text-[62px]"
          >
            Your next opportunity deserves a better approach.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="mx-auto mt-5 max-w-[620px] font-ui text-[17px] leading-[1.6] text-lp-body sm:text-[18px]"
          >
            Discover relevant jobs, understand where you stand, and tailor every application to the
            opportunity — all from one career workspace.
          </motion.p>

          {/* Three core pillars */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-ui text-[13px] font-medium text-lp-ink"
          >
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5 text-lp-accent" aria-hidden="true" />
              One career profile
            </span>
            <span className="text-lp-border" aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-lp-accent" aria-hidden="true" />
              Smarter job matching
            </span>
            <span className="text-lp-border" aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-lp-accent" aria-hidden="true" />
              Tailored applications
            </span>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          >
            <Link
              href="/signup"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-lp-wine px-6 font-ui text-sm font-medium text-white shadow-xs transition-all duration-150 hover:bg-lp-wine-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent sm:w-auto"
            >
              Get started — it&apos;s free
              <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 w-full items-center justify-center rounded-[12px] border border-lp-border bg-lp-surface-subtle px-6 font-ui text-sm font-medium text-lp-ink transition-colors duration-150 hover:bg-lp-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent sm:w-auto"
            >
              See how it works
            </a>
          </motion.div>

          <p className="mt-3.5 font-ui text-xs text-lp-muted">
            No credit card required · You&apos;re always in control
          </p>
        </div>

        {/* Connected Product Workspace Demonstration directly below */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="mt-14 sm:mt-16"
        >
          <div className="overflow-hidden rounded-2xl border border-lp-border bg-lp-bg shadow-[0_1px_3px_rgba(17,24,39,0.04),0_20px_48px_rgba(17,24,39,0.08)]">
            {/* Workspace Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lp-border bg-lp-surface-subtle px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2.5">
                <Layers className="h-4 w-4 text-lp-accent" aria-hidden="true" />
                <span className="font-ui text-[13px] font-semibold text-lp-ink">
                  ApplyPilot Career Workspace
                </span>
                <span className="hidden rounded-full border border-lp-border bg-lp-bg px-2 py-0.5 font-mono text-[11px] text-lp-muted sm:inline-block">
                  Illustrative workspace preview
                </span>
              </div>
              <div className="flex items-center gap-2 font-ui text-xs text-lp-muted">
                <span>Select an opportunity to see live tailoring:</span>
                <div className="inline-flex rounded-lg border border-lp-border bg-lp-bg p-0.5">
                  {sampleOpportunities.map((opp, idx) => (
                    <button
                      key={opp.id}
                      type="button"
                      onClick={() => setSelectedIdx(idx)}
                      className={`rounded-md px-2.5 py-1 font-ui text-xs font-medium transition-colors ${selectedIdx === idx
                          ? "bg-lp-ink text-white"
                          : "text-lp-body hover:text-lp-ink"
                        }`}
                    >
                      {opp.role}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Three-Column Connected Workspace */}
            <div className="grid divide-y divide-lp-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
              {/* Column 1: Master Candidate Profile */}
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-lp-muted">
                    01 · Master Profile
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-ui text-[11px] font-medium text-emerald-700">
                    Verified
                  </span>
                </div>
                <div className="mt-4">
                  <p className="font-ui text-base font-semibold text-lp-ink">{sampleCandidate.name}</p>
                  <p className="mt-0.5 font-ui text-xs text-lp-body">{sampleCandidate.targetRole}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {sampleCandidate.skills.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md border border-lp-border bg-lp-surface-subtle px-2 py-0.5 font-ui text-xs font-medium text-lp-ink"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-4 rounded-lg border border-lp-border bg-lp-surface-subtle p-3">
                  <p className="font-ui text-xs font-medium text-lp-ink">
                    {sampleCandidate.experience[0]!.role} · {sampleCandidate.experience[0]!.company}
                  </p>
                  <p className="mt-1 font-ui text-xs leading-relaxed text-lp-body">
                    {sampleCandidate.experience[0]!.bullet}
                  </p>
                </div>
              </div>

              {/* Column 2: Opportunity Fit */}
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-lp-muted">
                    02 · Opportunity Fit
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-lp-accent-soft px-2.5 py-0.5 font-ui text-[11px] font-medium text-lp-accent">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    {selected.alignmentLabel}
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="mt-4"
                  >
                    <p className="font-ui text-base font-semibold text-lp-ink">{selected.role}</p>
                    <p className="mt-0.5 flex items-center gap-1 font-ui text-xs text-lp-muted">
                      {selected.company} · <MapPin className="h-3 w-3" aria-hidden="true" />
                      {selected.location}
                    </p>
                    <p className="mt-3 font-ui text-xs leading-relaxed text-lp-body">
                      {selected.summary}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {selected.aligns.slice(0, 2).map((item) => (
                        <li key={item.label} className="flex items-start gap-2 font-ui text-xs text-lp-ink">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" aria-hidden="true" />
                          <span>{item.label}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Column 3: Tailored Resume Output */}
              <div className="bg-lp-surface-subtle/60 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-lp-muted">
                    03 · Tailored Resume
                  </span>
                  <span className="font-mono text-[11px] text-lp-body">
                    Candidate review required
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="mt-4"
                  >
                    <div className="rounded-lg border border-lp-accent/25 bg-lp-bg p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-medium text-lp-accent">
                          Suggested adaptation
                        </span>
                        <span className="rounded bg-lp-surface px-1.5 py-0.5 font-mono text-[10px] text-lp-muted">
                          {selected.resumeVersion}
                        </span>
                      </div>
                      <p className="mt-2 font-ui text-xs font-semibold text-lp-ink">
                        {selected.tailoredTitle}
                      </p>
                      <p className="mt-1 font-ui text-xs leading-relaxed text-lp-body">
                        {selected.tailoredBullet}
                      </p>
                    </div>
                    <p className="mt-3 font-ui text-[11px] leading-relaxed text-lp-muted">
                      <span className="font-medium text-lp-ink">Grounded in evidence: </span>
                      {selected.tailoringReason}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
