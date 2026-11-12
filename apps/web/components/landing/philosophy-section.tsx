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
    <section id="philosophy" className="bg-lp-ink py-20 text-white sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="max-w-[740px]">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-blue-400">
            The ApplyPilot approach
          </p>
          <h2 className="mt-3 font-ui text-[32px] font-semibold leading-[1.12] tracking-[-0.02em] text-white sm:text-[42px]">
            More applications aren&apos;t always better. Better decisions are.
          </h2>
          <p className="mt-4 font-ui text-[16px] leading-[1.65] text-gray-300">
            A meaningful job search isn&apos;t measured by how many applications you send.
            It&apos;s about understanding your strengths, recognizing worthwhile opportunities and
            presenting your experience honestly.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Conventional Approach */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-wider text-gray-400">
              The conventional approach
            </p>
            <ul className="mt-5 space-y-3.5">
              {CONVENTIONAL.map((item) => (
                <li key={item} className="flex items-center gap-3 font-ui text-[15px] text-gray-300">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-gray-400">
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ApplyPilot Approach */}
          <div className="rounded-2xl border border-blue-500/40 bg-blue-950/30 p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-wider text-blue-400">
              The ApplyPilot approach
            </p>
            <ul className="mt-5 space-y-3.5">
              {APPLYPILOT_WAY.map((item) => (
                <li key={item} className="flex items-center gap-3 font-ui text-[15px] font-medium text-white">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-white/10 pt-8 font-ui text-[16px] font-medium text-gray-200">
          You make the decisions. ApplyPilot helps you make them with better information.
        </p>
      </div>
    </section>
  );
}

