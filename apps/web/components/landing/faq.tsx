"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS: Array<{ question: string; answer: string }> = [
  {
    question: "What is ApplyPilot?",
    answer:
      "ApplyPilot is an AI-assisted job-search workspace. It connects your candidate profile, relevant opportunities, application preparation and follow-through in one unified workspace.",
  },
  {
    question: "Who is it for?",
    answer:
      "New graduates, active job seekers applying to multiple roles, career switchers, and experienced candidates exploring better opportunities without compromising their privacy.",
  },
  {
    question: "Does it work with my existing résumé?",
    answer:
      "Yes. Upload a PDF or DOCX résumé and ApplyPilot extracts a structured profile from it — you review and confirm every field before it's saved.",
  },
  {
    question: "Does ApplyPilot apply to jobs automatically?",
    answer:
      "Not today. Application preparation and submission automation are candidate-controlled. Nothing is sent or submitted without your review and approval.",
  },
  {
    question: "Can I review and edit application material?",
    answer:
      "Yes — reviewing and editing is the default. Any AI-suggested change is shown to you side-by-side before it's used, and you can edit or discard it.",
  },
  {
    question: "Which job sources and application systems are supported?",
    answer:
      "Greenhouse, Lever, Workday, and standard ATS application formats are supported with verified parsing schemas. We publish coverage updates as new systems are integrated.",
  },
  {
    question: "Is my personal information secure?",
    answer:
      "Your account is protected with industry-standard password hashing and session security, and your profile data is strictly isolated to your account.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "You can create a profile and manage your résumés today at no cost — we'll share transparent pricing details before any paid tiers are introduced.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-ap-paper py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[760px] px-5 sm:px-8">
        <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-ap-vermilion font-semibold">
          Got Questions?
        </p>
        <h2 className="mt-2 font-display text-[32px] leading-[1.1] text-ap-ink sm:text-[40px]">
          Questions, answered plainly.
        </h2>

        <div className="mt-10 divide-y divide-ap-line border-t border-ap-line">
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full cursor-pointer list-none items-center justify-between gap-4 text-left font-ui text-[16px] font-medium text-ap-ink transition-colors hover:text-ap-vermilion focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-vermilion"
                >
                  <span>{item.question}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="h-5 w-5 text-ap-muted" strokeWidth={1.75} aria-hidden="true" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="mt-3 max-w-xl font-ui text-[15px] leading-relaxed text-ap-body">
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
