"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  MapPin,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { sampleCandidate, sampleOpportunities } from "./sample-data";

export function Hero() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = sampleOpportunities[selectedIdx] ?? sampleOpportunities[0]!;

  return (
    <section className="relative overflow-hidden border-b border-lp-border bg-lp-bg pt-12 pb-20 sm:pt-16 sm:pb-24">
      {/* Subtle HeyRetro-style ambient radial glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-44 left-1/2 -z-0 h-[420px] w-[960px] -translate-x-1/2 opacity-75"
        style={{
          background:
            "radial-gradient(circle at 22% 50%, rgba(236, 90, 56, 0.16), transparent 48%), radial-gradient(circle at 78% 45%, rgba(83, 179, 163, 0.16), transparent 48%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* Centered Hero Header */}
        <div className="mx-auto max-w-[760px] text-center">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-ui text-[40px] font-bold leading-[1.06] tracking-[-0.035em] text-lp-ink sm:text-[56px] lg:text-[64px]"
          >
            Your next opportunity deserves a better approach.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="mx-auto mt-4 max-w-[580px] font-ui text-[16px] leading-[1.6] text-lp-body sm:text-[18px]"
          >
            Understand your strengths. Find opportunities that fit. Build an application that
            reflects your best work — all from one career workspace.
          </motion.p>
        </div>

        {/* Floating Collage Composition (HeyRetro-style center board + tilted flanking cards) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14 }}
          className="relative mx-auto mt-10 max-w-[1060px] sm:mt-12 lg:px-10"
        >
          {/* Top-left floating card */}
          <div className="pointer-events-none absolute -top-5 -left-2 z-20 hidden w-[210px] -rotate-3 rounded-2xl border border-lp-border bg-white p-3.5 shadow-[0_12px_30px_rgba(43,35,32,0.09)] xl:block">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-lp-accent-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-lp-accent">
                Profile Verified
              </span>
              <span className="font-mono text-[10px] text-lp-muted">4/4</span>
            </div>
            <p className="mt-2 font-ui text-xs font-semibold text-lp-ink">
              {sampleCandidate.targetRole}
            </p>
            <p className="mt-1 font-ui text-[11px] text-lp-body">
              All claims backed by source history
            </p>
          </div>

          {/* Top-right floating card */}
          <div className="pointer-events-none absolute -top-4 -right-2 z-20 hidden w-[215px] rotate-3 rounded-2xl border border-lp-border bg-white p-3.5 shadow-[0_12px_30px_rgba(43,35,32,0.09)] xl:block">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-lp-peach px-2 py-0.5 font-mono text-[10px] font-semibold text-lp-wine">
                {selected.alignmentLabel}
              </span>
              <Sparkles className="h-3.5 w-3.5 text-lp-wine" aria-hidden="true" />
            </div>
            <p className="mt-2 font-ui text-xs font-semibold text-lp-ink">{selected.role}</p>
            <p className="mt-0.5 font-ui text-[11px] text-lp-muted">{selected.company}</p>
          </div>

          {/* Bottom-left floating card */}
          <div className="pointer-events-none absolute -bottom-5 left-2 z-20 hidden w-[220px] rotate-2 rounded-2xl border border-lp-border bg-white p-3.5 shadow-[0_12px_30px_rgba(43,35,32,0.09)] xl:block">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <span className="font-ui text-xs font-semibold text-lp-ink">
                Zero hallucinations
              </span>
            </div>
            <p className="mt-1 font-ui text-[11px] leading-snug text-lp-body">
              Every tailored bullet links to your verified experience.
            </p>
          </div>

          {/* Bottom-right dark floating card */}
          <div className="pointer-events-none absolute -right-1 -bottom-5 z-20 hidden w-[225px] -rotate-2 rounded-2xl border border-white/10 bg-[#141413] p-3.5 text-white shadow-[0_14px_34px_rgba(20,20,19,0.22)] xl:block">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-white/75">
                <span className="h-1.5 w-1.5 rounded-full bg-lp-wine" />
                Companion Active
              </span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/80">
                Synced
              </span>
            </div>
            <p className="mt-2 font-ui text-xs font-semibold text-white">
              {selected.resumeVersion}
            </p>
            <p className="mt-0.5 font-ui text-[11px] text-white/65">
              Ready for review &amp; export
            </p>
          </div>

          {/* Center Main Interactive Board */}
          <div className="rounded-[24px] border border-lp-border bg-white shadow-[0_20px_60px_rgba(43,35,32,0.1)]">
            <div className="overflow-hidden rounded-[24px]">
              {/* Workspace Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lp-border bg-lp-bg/70 px-4 py-3.5 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lp-peach text-lp-wine">
                    <Layers className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="font-ui text-[13px] font-semibold text-lp-ink">
                    ApplyPilot Career Board
                  </span>
                  <span className="hidden rounded-full bg-lp-accent-soft px-2.5 py-0.5 font-mono text-[11px] font-medium text-lp-accent sm:inline-block">
                    Interactive preview
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 font-ui text-xs text-lp-muted">
                  <span>Select an opportunity:</span>
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
          </div>
        </motion.div>

        {/* CTAs below floating collage (HeyRetro-style) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.24 }}
          className="mt-10 text-center"
        >
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-3.5">
            <Link
              href="/signup"
              className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#141413] px-6 font-ui text-sm font-semibold text-white shadow-[0_6px_18px_rgba(20,20,19,0.18)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#2b2320] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-wine sm:w-auto"
            >
              Get started — it&apos;s free
              <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-lp-border bg-white px-6 font-ui text-sm font-semibold text-lp-ink shadow-2xs transition-colors duration-150 hover:bg-lp-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent sm:w-auto"
            >
              See how it works
            </a>
          </div>
          <p className="mt-3 font-ui text-xs text-lp-muted">
            Free account creation · No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  );
}
