"use client";

import { useState } from "react";
import {
  Briefcase,
  Check,
  CheckCircle2,
  FolderGit2,
  GraduationCap,
  PencilLine,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";
import { sampleCandidate } from "./sample-data";

const HIGHLIGHTS = [
  "Import existing resumes.",
  "Organize experience and education.",
  "Capture skills and technical competencies.",
  "Showcase personal and professional projects.",
  "Maintain one source of truth for your application materials.",
];

export function CandidateIntelligence() {
  const [confirmed, setConfirmed] = useState(true);

  return (
    <section id="candidate-intelligence" className="border-b border-lp-border bg-lp-bg py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid items-center gap-10 rounded-2xl border border-lp-border bg-white p-6 shadow-[0_4px_24px_rgba(24,23,22,0.04)] sm:p-10 lg:grid-cols-[minmax(0,440px)_1fr] lg:gap-14 lg:p-12">
          {/* Left: Copy */}
          <div>
            <p className="inline-flex rounded-full bg-lp-accent-soft px-3 py-1 font-mono text-[11px] font-medium tracking-wider text-lp-accent">
              YOUR PROFESSIONAL FOUNDATION
            </p>
            <h2 className="mt-4 font-ui text-[32px] font-bold leading-[1.12] tracking-[-0.025em] text-lp-ink sm:text-[40px]">
              Your experience, understood.
            </h2>
            <p className="mt-4 font-ui text-[16px] leading-[1.65] text-lp-body">
              Your resume is only one part of your professional story.
            </p>
            <p className="mt-3 font-ui text-[15px] leading-[1.65] text-lp-body">
              Bring your skills, experience, education and projects into one structured profile.
              Review what ApplyFocus extracts, correct anything that needs attention, and build a
              profile that grows with your career.
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

          {/* Right: Structured Candidate Profile Demonstration */}
          <div className="overflow-hidden rounded-xl border border-lp-border bg-lp-bg shadow-sm">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lp-border bg-lp-surface/50 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-lp-accent" aria-hidden="true" />
                <span className="font-ui text-sm font-semibold text-lp-ink">Candidate Profile</span>
              </div>
              <span className="rounded-md border border-lp-border bg-white px-2 py-0.5 font-mono text-[10px] text-lp-muted">
                Structured master record
              </span>
            </div>

          <div className="p-5 sm:p-6">
            {/* Candidate Summary + Progress */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-lp-border pb-5">
              <div>
                <h3 className="font-ui text-lg font-semibold text-lp-ink">{sampleCandidate.name}</h3>
                <p className="mt-0.5 font-ui text-sm text-lp-body">
                  {sampleCandidate.targetRole} · {sampleCandidate.location}
                </p>
              </div>
              <div className="min-w-[160px]">
                <div className="flex items-center justify-between font-mono text-[11px] text-lp-muted">
                  <span>Profile completeness</span>
                  <span className="font-semibold text-lp-ink">{sampleCandidate.completionPercent}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-lp-surface">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${sampleCandidate.completionPercent}%` }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="h-full rounded-full bg-lp-accent"
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="mt-5">
              <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-lp-muted">
                Skills &amp; Technical Competencies
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {sampleCandidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md border border-lp-border bg-lp-surface-subtle px-2.5 py-1 font-ui text-xs font-medium text-lp-ink"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience & Education + Projects */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-lp-border bg-lp-surface-subtle/60 p-4">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-lp-muted">
                  <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                  Experience
                </div>
                <div className="mt-2.5 space-y-2.5">
                  {sampleCandidate.experience.map((exp) => (
                    <div key={exp.company}>
                      <p className="font-ui text-[13px] font-semibold text-lp-ink">{exp.role}</p>
                      <p className="font-ui text-xs text-lp-muted">
                        {exp.company} · {exp.period}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-lp-border bg-lp-surface-subtle/60 p-4">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-lp-muted">
                    <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                    Education
                  </div>
                  <p className="mt-2 font-ui text-[13px] font-semibold text-lp-ink">
                    {sampleCandidate.education.degree}
                  </p>
                  <p className="font-ui text-xs text-lp-muted">
                    {sampleCandidate.education.institution} · {sampleCandidate.education.year}
                  </p>
                </div>

                <div className="rounded-xl border border-lp-border bg-lp-surface-subtle/60 p-4">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-lp-muted">
                    <FolderGit2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Projects
                  </div>
                  <p className="mt-2 font-ui text-[13px] font-semibold text-lp-ink">
                    {sampleCandidate.projects[0]!.name}
                  </p>
                  <p className="mt-0.5 font-ui text-xs leading-relaxed text-lp-body">
                    {sampleCandidate.projects[0]!.detail}
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Extraction Review Bar */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lp-border bg-lp-surface-subtle px-4 py-3">
              <div className="flex items-center gap-2 font-ui text-xs text-lp-body">
                <PencilLine className="h-3.5 w-3.5 text-lp-ink" aria-hidden="true" />
                <span>
                  Extracted from uploaded resume —{" "}
                  <strong className="font-medium text-lp-ink">
                    {confirmed ? "reviewed and confirmed" : "ready for review"}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setConfirmed((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-ui text-xs font-medium transition-colors ${
                  confirmed
                    ? "bg-emerald-600 text-white"
                    : "border border-lp-border bg-lp-bg text-lp-ink hover:bg-lp-surface"
                }`}
              >
                {confirmed && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                {confirmed ? "Confirmed" : "Confirm details"}
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

