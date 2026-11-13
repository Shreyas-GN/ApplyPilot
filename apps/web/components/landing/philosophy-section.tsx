import { Check, X } from "lucide-react";

const CONVENTIONAL = [
  "Apply everywhere.",
  "Reuse the same resume.",
  "Guess your fit.",
  "Lose track of applications.",
];

const APPLYPILOT_WAY = [
  "Understand your profile.",
  "Evaluate opportunities.",
  "Tailor each application.",
  "Stay informed.",
];

export function PhilosophySection() {
  return (
    <section id="philosophy" className="border-b border-lp-border bg-lp-bg py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="rounded-[32px] border border-white/10 bg-[#141413] p-8 text-white shadow-[0_20px_60px_rgba(20,20,19,0.18)] sm:p-14">
          <div className="max-w-[740px]">
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 font-mono text-[11px] font-medium tracking-wider text-[#d8cefe]">
              THE APPLYPILOT PHILOSOPHY
            </p>
            <h2 className="mt-4 font-ui text-[32px] font-bold leading-[1.12] tracking-[-0.025em] text-white sm:text-[42px]">
              More applications aren&apos;t always better. Better decisions are.
            </h2>
            <p className="mt-4 font-ui text-[16px] leading-[1.65] text-white/75">
              A meaningful job search isn&apos;t measured by how many applications you send.
              It&apos;s about understanding your strengths, recognizing worthwhile opportunities and
              presenting your experience honestly.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* Conventional Approach */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
              <p className="font-mono text-xs uppercase tracking-wider text-white/50">
                The conventional approach
              </p>
              <ul className="mt-5 space-y-3.5">
                {CONVENTIONAL.map((item) => (
                  <li key={item} className="flex items-center gap-3 font-ui text-[15px] text-white/75">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/60">
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ApplyFocus Approach */}
            <div className="rounded-2xl border border-[#7c66dc]/40 bg-white/[0.08] p-6 sm:p-8">
              <p className="font-mono text-xs uppercase tracking-wider text-[#d8cefe]">
                The ApplyFocus approach
              </p>
              <ul className="mt-5 space-y-3.5">
                {APPLYPILOT_WAY.map((item) => (
                  <li key={item} className="flex items-center gap-3 font-ui text-[15px] font-medium text-white">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#5e48b8] text-white">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-10 border-t border-white/10 pt-8 font-ui text-[15px] font-medium text-white/70">
            You make the decisions. ApplyFocus helps you make them with better information.
          </p>
        </div>
      </div>
    </section>
  );
}

