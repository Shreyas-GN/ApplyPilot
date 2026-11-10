"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { CircleAnnotation } from "./annotation";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-ap-paper-deep py-20 sm:py-28 lg:py-32">
      {/* Subtle ambient accent glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-ap-vermilion/5 blur-3xl" />

      <div className="relative mx-auto max-w-[700px] px-5 text-center sm:px-8">
        <div className="relative inline-block">
          <h2 className="font-display text-[32px] leading-[1.1] text-ap-ink sm:text-[44px]">
            Make your next move a considered one.
          </h2>
          <CircleAnnotation className="pointer-events-none absolute -right-8 -top-6 hidden h-12 w-24 text-ap-vermilion sm:block" />
        </div>
        <p className="mx-auto mt-5 max-w-md font-ui text-[16px] leading-relaxed text-ap-body">
          Start with your profile. Build a job search that feels more organised, focused and
          manageable.
        </p>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block mt-8">
          <Link
            href="/signup"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-button bg-ap-ink px-8 font-ui text-sm font-medium text-ap-paper shadow-sm transition-all duration-150 hover:bg-ap-ink/90 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-vermilion"
          >
            Get started today
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </motion.div>

        <p className="mt-4 text-xs font-mono text-ap-muted">
          Free account creation · No credit card required
        </p>
      </div>
    </section>
  );
}
