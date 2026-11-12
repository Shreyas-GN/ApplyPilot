import { Compass, Eye, FileCheck2, ShieldCheck } from "lucide-react";

const PRINCIPLES = [
  {
    icon: Eye,
    title: "Your information",
    description: "Review and manage your professional profile.",
  },
  {
    icon: FileCheck2,
    title: "Your applications",
    description: "Inspect suggested changes before using them.",
  },
  {
    icon: ShieldCheck,
    title: "Your approval",
    description: "No consequential application submission without your confirmation.",
  },
  {
    icon: Compass,
    title: "Your decisions",
    description: "Choose which opportunities to pursue.",
  },
];

export function TrustPrivacy() {
  return (
    <section id="trust" className="border-b border-lp-border bg-lp-bg py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="max-w-[680px]">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-lp-accent">
            Built around your control
          </p>
          <h2 className="mt-3 font-ui text-[32px] font-semibold leading-[1.12] tracking-[-0.02em] text-lp-ink sm:text-[40px]">
            Your career information belongs to you.
          </h2>
          <p className="mt-4 font-ui text-[16px] leading-[1.65] text-lp-body">
            Your professional history is personal. ApplyPilot should make it easier to work with
            your information without taking decisions away from you.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-lp-border bg-lp-surface-subtle p-6"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-lp-border bg-lp-bg text-lp-ink">
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-ui text-base font-semibold text-lp-ink">{title}</h3>
              <p className="mt-2 font-ui text-sm leading-relaxed text-lp-body">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

