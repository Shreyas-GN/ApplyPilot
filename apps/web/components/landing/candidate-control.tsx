"use client";

import { useState } from "react";
import { Eye, FileEdit, PenLine, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const PRINCIPLES = [
  { icon: Eye, text: "Review profile information." },
  { icon: FileEdit, text: "Inspect suggested changes." },
  { icon: PenLine, text: "Edit application material." },
  { icon: ShieldCheck, text: "Confirm before any consequential submission." },
];

export function CandidateControl() {
  const [approved, setApproved] = useState(false);

  return (
    <section className="bg-ap-paper py-16 sm:py-24 lg:py-28">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-16">
        <div className="order-2 lg:order-1">
          <div className="rounded-panel border border-ap-line bg-ap-surface-muted p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between gap-4 rounded-card border border-ap-line bg-ap-surface px-4 py-3.5 shadow-2xs">
              <p className="font-ui text-[13px] text-ap-body">
                Cover letter draft ready —{" "}
                <span className={`font-medium ${approved ? "text-ap-sage" : "text-ap-ink"}`}>
                  {approved ? "approved and ready to send" : "awaiting your review"}
                </span>
              </p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setApproved((prev) => !prev)}
                className={`flex-shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 font-ui text-[12px] font-medium transition-all ${
                  approved
                    ? "bg-ap-sage text-white shadow-xs"
                    : "bg-ap-sage-soft text-ap-sage hover:bg-ap-sage hover:text-white"
                }`}
              >
                {approved ? (
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                  </span>
                ) : (
                  "Click to approve"
                )}
              </motion.button>
            </div>
            <p className="mt-3 font-mono text-[11px] text-ap-muted">
              Nothing is sent or submitted without this step. Candidate consent is mandatory.
            </p>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <h2 className="font-display text-[32px] leading-[1.1] text-ap-ink sm:text-[40px]">
            You stay in the driver&apos;s seat.
          </h2>
          <ul className="mt-6 space-y-4">
            {PRINCIPLES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <Icon className="h-5 w-5 flex-shrink-0 text-ap-ink" strokeWidth={1.75} aria-hidden="true" />
                <p className="font-ui text-[15px] text-ap-body">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
