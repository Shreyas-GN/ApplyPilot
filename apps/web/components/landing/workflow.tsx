"use client";

import { motion } from "framer-motion";
import { ProfileArtifact } from "./artifacts/profile-artifact";
import { DiscoveryArtifact } from "./artifacts/discovery-artifact";
import { PreparationArtifact } from "./artifacts/preparation-artifact";
import { TrackerArtifact } from "./artifacts/tracker-artifact";

const STEPS = [
  {
    number: "01",
    tag: "Structured Data",
    title: "Build your profile",
    body: "Bring your experience, skills and résumé into one structured profile. Everything is reviewable before anything touches your account.",
    Artifact: ProfileArtifact,
  },
  {
    number: "02",
    tag: "Match Radar",
    title: "Find relevant roles",
    body: "Explore opportunities against your actual background and preferences, with clear signals on where you stand.",
    Artifact: DiscoveryArtifact,
  },
  {
    number: "03",
    tag: "Side-by-Side Review",
    title: "Prepare your application",
    body: "Review tailored application bullet points and cover letter suggestions side-by-side. You approve every word.",
    Artifact: PreparationArtifact,
  },
  {
    number: "04",
    tag: "Pipeline Kanban",
    title: "Keep the process moving",
    body: "Track applications across all stages, log interview notes, and know exactly what needs your attention next.",
    Artifact: TrackerArtifact,
  },
];

export function Workflow() {
  return (
    <section id="how-it-works" className="relative bg-ap-paper py-16 sm:py-24 lg:py-28 overflow-hidden">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="max-w-xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-ap-vermilion font-semibold">
            How it works
          </p>
          <h2 className="mt-3 font-display text-[32px] leading-[1.1] text-ap-ink sm:text-[40px]">
            One workflow, from profile to progress.
          </h2>
          <p className="mt-3 font-ui text-[15px] text-ap-body">
            Four disciplined steps designed to maximize offer rates without spamming.
          </p>
        </div>

        <div className="relative mt-12 flex flex-col gap-16 sm:mt-16 sm:gap-24">
          {STEPS.map((step, index) => {
            const reversed = index % 2 === 1;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
              >
                <div className={reversed ? "lg:order-2" : undefined}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ap-ink text-ap-paper font-mono text-xs font-semibold">
                      {step.number}
                    </span>
                    <span className="rounded-full border border-ap-line bg-ap-surface px-2.5 py-0.5 font-mono text-[11px] font-medium text-ap-muted">
                      {step.tag}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-2xl text-ap-ink sm:text-[28px]">{step.title}</h3>
                  <p className="mt-3 max-w-sm font-ui text-[15px] leading-relaxed text-ap-body">{step.body}</p>
                </div>
                <div className={`${reversed ? "lg:order-1" : undefined} transition-transform duration-200 hover:-translate-y-1`}>
                  <step.Artifact compact />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
