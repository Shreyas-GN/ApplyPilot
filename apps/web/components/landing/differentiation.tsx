"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, HelpCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UnderlineAnnotation } from "./annotation";

const APPLYPILOT_EVIDENCE = [
  {
    icon: CheckCircle2,
    tone: "text-ap-sage",
    label: "Skills that align",
    body: "Python, FastAPI and REST API experience already confirmed on Asha's verified profile.",
  },
  {
    icon: AlertCircle,
    tone: "text-ap-vermilion",
    label: "Requirements not yet demonstrated",
    body: "Relational-database depth isn't clearly shown yet — prompt offered to add relevant course/project work.",
  },
  {
    icon: HelpCircle,
    tone: "text-ap-muted",
    label: "Not enough information",
    body: "No signal on production on-call experience — flagged so you can address it directly in interviews.",
  },
];

const BOT_EVIDENCE = [
  {
    icon: XCircle,
    tone: "text-red-500",
    label: "Fabricated claims",
    body: "Hallucinates 5 years of AWS Kubernetes experience never held by the candidate.",
  },
  {
    icon: XCircle,
    tone: "text-red-500",
    label: "Blind submissions",
    body: "Blasts 300 applications without checking location, visa, or salary preferences.",
  },
  {
    icon: XCircle,
    tone: "text-red-500",
    label: "Immediate ATS rejection",
    body: "Flagged by Greenhouse/Lever spam detectors, burning candidate reputation.",
  },
];

export function Differentiation() {
  const [mode, setMode] = useState<"applypilot" | "bots">("applypilot");

  return (
    <section className="bg-ap-paper-deep py-16 sm:py-24 lg:py-28">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16">
        <div>
          <h2 className="relative inline-block font-display text-[32px] leading-[1.1] text-ap-ink sm:text-[40px]">
            More applications aren&apos;t always better.
            <UnderlineAnnotation className="absolute -bottom-2 left-0 h-3 w-40 text-ap-vermilion" />
          </h2>
          <p className="mt-6 max-w-sm font-ui text-[15px] leading-relaxed text-ap-body">
            A useful job search is about spending effort on roles that make sense, understanding
            why they fit, and preparing applications with care — not applying to everything you
            can find.
          </p>

          <div className="mt-8 flex items-center gap-2 rounded-full border border-ap-line bg-ap-surface p-1 max-w-fit shadow-2xs">
            <button
              type="button"
              onClick={() => setMode("applypilot")}
              className={`rounded-full px-3.5 py-1.5 font-ui text-xs font-medium transition-all ${
                mode === "applypilot"
                  ? "bg-ap-ink text-ap-paper shadow-xs"
                  : "text-ap-muted hover:text-ap-ink"
              }`}
            >
              ApplyPilot Way
            </button>
            <button
              type="button"
              onClick={() => setMode("bots")}
              className={`rounded-full px-3.5 py-1.5 font-ui text-xs font-medium transition-all ${
                mode === "bots"
                  ? "bg-red-900/10 text-red-700 font-semibold"
                  : "text-ap-muted hover:text-ap-ink"
              }`}
            >
              Mass-Applier Bots
            </button>
          </div>
        </div>

        <div className="rounded-panel border border-ap-line bg-ap-surface p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between border-b border-ap-line pb-4">
            <p className="font-ui text-sm font-semibold text-ap-ink">
              {mode === "applypilot"
                ? "Fit reasoning — Backend Engineer, Northstar Systems"
                : "Typical Bot Output — Unregulated Mass Submissions"}
            </p>
            <span className={`font-mono text-xs px-2.5 py-0.5 rounded-full ${
              mode === "applypilot" ? "bg-ap-sage-soft text-ap-sage" : "bg-red-100 text-red-700"
            }`}>
              {mode === "applypilot" ? "High Quality" : "Spam Risk"}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.ul
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mt-5 space-y-4"
            >
              {(mode === "applypilot" ? APPLYPILOT_EVIDENCE : BOT_EVIDENCE).map(
                ({ icon: Icon, tone, label, body }) => (
                  <li key={label} className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${tone}`} strokeWidth={1.75} aria-hidden="true" />
                    <div className="font-ui text-[14px] leading-relaxed text-ap-body">
                      <span className="font-medium text-ap-ink">{label} — </span>
                      {body}
                    </div>
                  </li>
                )
              )}
            </motion.ul>
          </AnimatePresence>

          <p className="mt-6 border-t border-ap-line/70 pt-4 font-mono text-[11px] text-ap-muted">
            {mode === "applypilot"
              ? "Illustrative match evidence — shown as transparent reasoning, not arbitrary black-box scores."
              : "Generic bots submit low-quality duplicates that trigger automatic ATS blacklisting."}
          </p>
        </div>
      </div>
    </section>
  );
}
