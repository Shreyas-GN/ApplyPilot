import { CheckCircle2, Clock, FileCheck2, Globe, PanelRight } from "lucide-react";

const HIGHLIGHTS = [
  "Keep your tailored resumes organized.",
  "Access the right resume for each opportunity.",
  "Get assistance with supported application forms.",
  "Reuse your candidate information.",
  "Review information before submitting.",
  "Keep external applications connected to your tracker.",
];

export function ApplicationCompanion() {
  return (
    <section id="companion" className="border-b border-lp-border bg-lp-bg py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,440px)_1fr] lg:gap-16">
          {/* Left: Copy */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-lp-accent">
                Apply where the opportunity takes you
              </p>
              <span className="inline-flex items-center gap-1 rounded-full border border-lp-border bg-lp-surface px-2.5 py-0.5 font-mono text-[11px] font-medium text-lp-body">
                <Clock className="h-3 w-3 text-lp-muted" aria-hidden="true" />
                Coming soon
              </span>
            </div>

            <h2 className="mt-3 font-ui text-[32px] font-semibold leading-[1.12] tracking-[-0.02em] text-lp-ink sm:text-[40px]">
              Your application workspace goes beyond job boards.
            </h2>
            <p className="mt-4 font-ui text-[16px] leading-[1.65] text-lp-body">
              Not every company accepts applications through the platform where you discovered its
              vacancy. ApplyPilot is designed to help you prepare and manage applications even when
              the final application happens on an employer&apos;s own website.
            </p>

            <ul className="mt-7 space-y-2.5">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 font-ui text-[14px] text-lp-ink">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-lp-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-7 font-ui text-sm font-medium text-lp-ink">
              Your job search shouldn&apos;t stop at the edge of another platform.
            </p>
          </div>

          {/* Right: Browser + Extension Side Panel Preview (clearly labeled Coming Soon / In Development) */}
          <div className="overflow-hidden rounded-2xl border border-lp-border bg-lp-bg shadow-[0_1px_3px_rgba(17,24,39,0.04),0_16px_40px_rgba(17,24,39,0.06)]">
            <div className="flex items-center justify-between border-b border-lp-border bg-lp-surface-subtle px-5 py-3">
              <div className="flex items-center gap-2 font-ui text-xs text-lp-muted">
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                <span>careers.example-company.com/apply</span>
              </div>
              <span className="rounded-full border border-lp-border bg-lp-bg px-2.5 py-0.5 font-mono text-[11px] text-lp-muted">
                Extension preview · Coming soon
              </span>
            </div>

            <div className="grid divide-y divide-lp-border sm:grid-cols-[1.2fr_1fr] sm:divide-x sm:divide-y-0">
              {/* Employer Application Page (Left) */}
              <div className="p-5 sm:p-6">
                <p className="font-mono text-[11px] uppercase tracking-wider text-lp-muted">
                  Employer application page
                </p>
                <p className="mt-2 font-ui text-base font-semibold text-lp-ink">
                  Backend Engineer
                </p>
                <p className="font-ui text-xs text-lp-muted">Example company · Bengaluru</p>

                <div className="mt-5 space-y-3">
                  <div>
                    <p className="font-ui text-[11px] font-medium text-lp-muted">Full Name</p>
                    <div className="mt-1 rounded-lg border border-lp-border bg-lp-surface-subtle px-3 py-2 font-ui text-xs text-lp-ink">
                      Asha Rao
                    </div>
                  </div>
                  <div>
                    <p className="font-ui text-[11px] font-medium text-lp-muted">Resume / CV</p>
                    <div className="mt-1 flex items-center justify-between rounded-lg border border-lp-border bg-lp-surface-subtle px-3 py-2 font-ui text-xs text-lp-ink">
                      <span>Asha_Rao_Backend_ExampleCo_v2.pdf</span>
                      <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <p className="font-ui text-[11px] font-medium text-lp-muted">Portfolio / GitHub</p>
                    <div className="mt-1 rounded-lg border border-lp-border bg-lp-surface-subtle px-3 py-2 font-ui text-xs text-lp-body">
                      github.com/asha-rao
                    </div>
                  </div>
                </div>
              </div>

              {/* ApplyPilot Companion Side Panel (Right) */}
              <div className="bg-lp-surface-subtle/70 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <PanelRight className="h-4 w-4 text-lp-accent" aria-hidden="true" />
                    <span className="font-ui text-xs font-semibold text-lp-ink">
                      ApplyPilot Companion
                    </span>
                  </div>
                  <span className="rounded bg-lp-accent-soft px-2 py-0.5 font-mono text-[10px] font-medium text-lp-accent">
                    In development
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-lp-border bg-lp-bg p-3.5">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-lp-muted">
                      Selected tailored resume
                    </p>
                    <p className="mt-1 font-ui text-xs font-medium text-lp-ink">
                      Backend_ExampleCo_v2.pdf
                    </p>
                  </div>

                  <div className="rounded-xl border border-lp-border bg-lp-bg p-3.5">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-lp-muted">
                      Autofill assistance
                    </p>
                    <p className="mt-1 font-ui text-xs text-lp-body">
                      Contact details and profile links prepared from your verified profile.
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-amber-800">
                      Review status
                    </p>
                    <p className="mt-1 font-ui text-xs font-medium text-amber-900">
                      Candidate review required before submission
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

