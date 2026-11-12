"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, MapPin, Scale, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sampleOpportunities } from "./sample-data";

const HIGHLIGHTS = [
  "Discover relevant opportunities from supported job sources.",
  "Understand required and preferred qualifications.",
  "Identify skills that align with your background.",
  "See missing or unverified requirements.",
  "Explore adjacent roles beyond your search terms.",
];

export function OpportunityIntelligence() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const current = sampleOpportunities[selectedIdx] ?? sampleOpportunities[0]!;

  return (
    <section id="opportunities" className="border-b border-lp-border bg-lp-bg py-20 sm:py-28">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_minmax(0,440px)] lg:gap-16">
        {/* Left: Opportunity Assessment Demonstration */}
        <div className="order-2 overflow-hidden rounded-2xl border border-lp-border bg-lp-bg shadow-[0_1px_3px_rgba(17,24,39,0.04),0_16px_40px_rgba(17,24,39,0.06)] lg:order-1">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lp-border bg-lp-surface-subtle px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-lp-ink" aria-hidden="true" />
              <span className="font-ui text-sm font-semibold text-lp-ink">
                Opportunity Assessment
              </span>
            </div>
            <div className="inline-flex rounded-lg border border-lp-border bg-lp-bg p-0.5">
              {sampleOpportunities.map((opp, idx) => (
                <button
                  key={opp.id}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`rounded-md px-2.5 py-1 font-ui text-xs font-medium transition-colors ${
                    selectedIdx === idx
                      ? "bg-lp-ink text-white"
                      : "text-lp-body hover:text-lp-ink"
                  }`}
                >
                  {opp.role}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="p-5 sm:p-6"
            >
              {/* Role Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-lp-border pb-4">
                <div>
                  <h3 className="font-ui text-lg font-semibold text-lp-ink">{current.role}</h3>
                  <p className="mt-0.5 flex items-center gap-1.5 font-ui text-xs text-lp-muted">
                    <span>{current.company}</span>
                    <span aria-hidden="true">·</span>
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    <span>{current.location}</span>
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-lp-accent-soft px-3 py-1 font-ui text-xs font-medium text-lp-accent">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  {current.alignmentLabel}
                </span>
              </div>

              {/* What aligns */}
              <div className="mt-5">
                <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-emerald-700">
                  What aligns
                </p>
                <ul className="mt-2.5 space-y-2.5">
                  {current.aligns.map((item, idx) => (
                    <motion.li
                      key={item.label}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600"
                          aria-hidden="true"
                        />
                        <div>
                          <p className="font-ui text-[13px] font-medium text-lp-ink">{item.label}</p>
                          <p className="mt-0.5 font-ui text-xs text-lp-body">{item.evidence}</p>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* What needs attention */}
              <div className="mt-5">
                <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-amber-700">
                  What needs attention
                </p>
                <ul className="mt-2.5 space-y-2.5">
                  {current.needsAttention.map((item, idx) => (
                    <motion.li
                      key={item.label}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 + idx * 0.05 }}
                      className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertCircle
                          className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600"
                          aria-hidden="true"
                        />
                        <div>
                          <p className="font-ui text-[13px] font-medium text-lp-ink">{item.label}</p>
                          <p className="mt-0.5 font-ui text-xs text-lp-body">{item.note}</p>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <p className="mt-5 border-t border-lp-border pt-3.5 font-mono text-[11px] text-lp-muted">
                Illustrative assessment. Each conclusion links to actual job requirements and
                candidate evidence — not an opaque percentage score.
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Copy */}
        <div className="order-1 lg:order-2">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-lp-accent">
            Discover with context
          </p>
          <h2 className="mt-3 font-ui text-[32px] font-semibold leading-[1.12] tracking-[-0.02em] text-lp-ink sm:text-[40px]">
            Don&apos;t just find jobs. Understand the opportunity.
          </h2>
          <p className="mt-4 font-ui text-[16px] leading-[1.65] text-lp-body">
            A job title tells you very little about whether a role is right for you.
          </p>
          <p className="mt-3 font-ui text-[15px] leading-[1.65] text-lp-body">
            ApplyPilot helps you evaluate opportunities against your actual experience, skills and
            preferences — so you can spend more time on roles that make sense.
          </p>

          <ul className="mt-7 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 font-ui text-[14px] text-lp-ink">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-lp-accent" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

