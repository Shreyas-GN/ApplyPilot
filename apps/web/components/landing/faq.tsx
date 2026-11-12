"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS: Array<{ question: string; answer: string }> = [
  {
    question: "What is ApplyPilot?",
    answer:
      "ApplyPilot is a career intelligence workspace that helps you organize your professional profile, discover relevant job opportunities, prepare tailored applications and manage your job search.",
  },
  {
    question: "Who is ApplyPilot for?",
    answer:
      "ApplyPilot is designed for job seekers at different career stages, from fresh graduates and early-career professionals to experienced candidates looking for their next opportunity.",
  },
  {
    question: "Do I need to create a new resume?",
    answer:
      "No. You can start with your existing resume and build a structured professional profile from your experience, skills, education and projects.",
  },
  {
    question: "Can I use a different resume for every job?",
    answer:
      "Yes. ApplyPilot's Adaptive Resume Engine is designed to create job-specific resume versions using your existing professional information. You can review and approve suggested changes before using them.",
  },
  {
    question: "Does ApplyPilot guarantee ATS compatibility?",
    answer:
      "No platform can guarantee that every employer's ATS will parse a resume perfectly. ApplyPilot aims to create clear, structured and machine-readable application documents.",
  },
  {
    question: "Do I have to apply through ApplyPilot?",
    answer:
      "No. The product is designed around your job-search workflow, including applications that take place on external employer websites. Browser extension assistance depends on supported functionality.",
  },
  {
    question: "Does ApplyPilot apply automatically?",
    answer:
      "ApplyPilot prioritizes candidate control. You review your application materials and confirm consequential submissions.",
  },
  {
    question: "Can I track jobs I found outside ApplyPilot?",
    answer:
      "The intended experience includes connecting external opportunities to your application tracker. The exact import and extension capabilities depend on the available implementation.",
  },
  {
    question: "Is my existing resume information editable?",
    answer:
      "Yes. You should be able to review, correct and update information extracted from your resume before using it.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "You can start with the free account option shown on the current signup flow. Any usage limits and paid features should be described in the published pricing information.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-b border-lp-border bg-lp-surface py-20 sm:py-28">
      <div className="mx-auto max-w-[760px] px-5 sm:px-8">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-lp-accent">
          Got questions?
        </p>
        <h2 className="mt-2 font-ui text-[32px] font-semibold leading-[1.12] tracking-[-0.02em] text-lp-ink sm:text-[40px]">
          Questions, answered plainly.
        </h2>

        <div className="mt-10 divide-y divide-lp-border border-y border-lp-border">
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;
            return (
              <div key={item.question} className="py-5">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 text-left font-ui text-[16px] font-medium text-lp-ink transition-colors hover:text-lp-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent"
                >
                  <span>{item.question}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="h-5 w-5 text-lp-muted" strokeWidth={1.75} aria-hidden="true" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="mt-3 max-w-2xl font-ui text-[15px] leading-relaxed text-lp-body">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
