"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Search, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowAnnotation } from "./annotation";
import { PreviewBadge } from "./preview-badge";
import { ProductWindow, Tag, StatusDot } from "./product-window";
import { sampleOpportunityList } from "./sample-data";

export function Hero() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = sampleOpportunityList[selectedIndex]!;

  return (
    <section className="relative overflow-hidden bg-ap-paper bg-dot-pattern">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,480px)_1fr] lg:items-center lg:gap-16 lg:py-28">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-ap-vermilion/20 bg-ap-vermilion-soft/50 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ap-vermilion"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ap-vermilion opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-ap-vermilion" />
            </span>
            Candidate-controlled opportunity workspace
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mt-4 font-display text-[42px] leading-[1.05] text-ap-ink sm:text-[56px] lg:text-[68px]"
          >
            Find better jobs.
            <br />
            Apply smarter.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mt-5 max-w-md font-ui text-lg leading-relaxed text-ap-body"
          >
            ApplyPilot brings your job search into one place — helping you understand fit,
            prepare thoughtful applications and stay on top of every next step.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/signup"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-button bg-ap-ink px-6 font-ui text-sm font-medium text-ap-paper shadow-sm transition-all duration-150 hover:bg-ap-ink/90 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-vermilion"
            >
              Get started
              <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-button border border-ap-line bg-ap-surface px-6 font-ui text-sm font-medium text-ap-ink transition-all duration-150 hover:bg-ap-surface-muted hover:border-ap-body/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-vermilion"
            >
              See how it works
            </a>
          </motion.div>

          <div className="mt-8 flex items-center gap-4 text-xs font-ui text-ap-muted">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-ap-sage" />
              Verified ATS parsers
            </span>
            <span className="text-ap-line">·</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-ap-sage" />
              Strict data isolation
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="relative"
        >
          <div className="hidden lg:block">
            <ArrowAnnotation className="absolute -left-10 top-6 h-14 w-20 -scale-x-100 text-ap-vermilion" />
          </div>

          <ProductWindow
            title="Opportunity workspace"
            icon={Search}
            badge={<PreviewBadge label="Product preview" />}
          >
            <div className="mb-2 flex items-center justify-between text-xs text-ap-muted font-ui">
              <span>Select a role to preview instant AI alignment:</span>
              <span className="font-mono text-[11px] text-ap-vermilion font-medium">Click to inspect</span>
            </div>

            <ul className="divide-y divide-ap-line rounded-lg border border-ap-line/70 bg-ap-surface p-1">
              {sampleOpportunityList.map((item, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <li
                    key={item.id}
                    onClick={() => {
                      setSelectedIndex(index);
                    }}
                    className={`relative cursor-pointer rounded-md p-3 transition-all duration-150 ${
                      isSelected
                        ? "bg-ap-surface-muted/90 shadow-2xs"
                        : "hover:bg-ap-surface-muted/40 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {isSelected && <StatusDot tone="vermilion" />}
                          <p className={`truncate font-ui text-sm font-medium ${isSelected ? "text-ap-ink font-semibold" : "text-ap-body"}`}>
                            {item.role}
                          </p>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 font-ui text-[13px] text-ap-muted">
                          {item.company}
                          <span aria-hidden="true">·</span>
                          <MapPin className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                          {item.location}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ${
                          isSelected ? "bg-ap-sage-soft text-ap-sage border border-ap-sage/30" : "bg-ap-surface-muted text-ap-muted"
                        }`}>
                          <Sparkles className="h-2.5 w-2.5" />
                          {item.fitLevel}
                        </span>

                        <div className="hidden flex-shrink-0 gap-1.5 sm:flex">
                          {item.tags.map((tag) => (
                            <Tag key={tag}>{tag}</Tag>
                          ))}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mt-4 rounded-card border border-ap-vermilion-soft bg-ap-vermilion-soft/40 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-ui text-[11px] font-medium uppercase tracking-wide text-ap-vermilion">
                    Why this fits · {selected.company}
                  </p>
                  <span className="font-mono text-xs font-semibold text-ap-ink">
                    Alignment: {selected.fitLevel}
                  </span>
                </div>
                <p className="mt-1.5 font-ui text-[13px] leading-relaxed text-ap-body">
                  {selected.reasoning}
                </p>
              </motion.div>
            </AnimatePresence>
          </ProductWindow>
        </motion.div>
      </div>
    </section>
  );
}
