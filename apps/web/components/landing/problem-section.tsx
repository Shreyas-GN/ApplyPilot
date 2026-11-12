import { AlertCircle, FileSearch, Layers } from "lucide-react";

export function ProblemSection() {
  const problems = [
    {
      number: "01",
      icon: FileSearch,
      title: "Too many opportunities, too little clarity",
      description:
        "Finding a job vacancy doesn't tell you whether it's actually right for your experience, compensation goals, and engineering philosophy.",
      badge: "High noise · Low signal",
      detail: "Evaluating 40+ job descriptions manually leads to cognitive overload and blind submissions.",
    },
    {
      number: "02",
      icon: Layers,
      title: "One static resume doesn't fit every opportunity",
      description:
        "Different jobs demand distinct emphasis on your technical stack and leadership scope. Generic AI resume tools invent claims that fail in technical interviews.",
      badge: "The credibility trap",
      detail: "Recruiters detect hallucinated buzzwords in seconds. True confidence requires verified evidence.",
    },
    {
      number: "03",
      icon: AlertCircle,
      title: "Applications become chaotic to track and manage",
      description:
        "External employer ATS portals, distinct resume versions, scheduled follow-ups, and recruiter screening calls quickly scatter across browser tabs.",
      badge: "Fragmented pipeline",
      detail: "Without a central career cockpit, candidates lose leverage, context, and follow-through timing.",
    },
  ];

  return (
    <section className="border-b border-lp-border bg-lp-bg py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="mx-auto max-w-[740px] text-center">
          <p className="inline-flex rounded-full border border-lp-border bg-white px-3.5 py-1 font-mono text-[11px] font-medium tracking-wider text-lp-accent shadow-2xs">
            THE JOB-SEARCH PARADOX
          </p>
          <h2 className="mt-4 font-ui text-[32px] font-bold leading-[1.12] tracking-[-0.03em] text-lp-ink sm:text-[44px]">
            Finding a job is one thing. Getting your application right is another.
          </h2>
          <p className="mt-4 font-ui text-[16px] leading-[1.65] text-lp-body">
            The modern job search is scattered across job boards, company career portals, resume
            drafts, spreadsheets, and endless application forms. More volume doesn&apos;t solve it.
            Better career decisions do.
          </p>
        </div>

        {/* ApplyPilot Unique 3-Column Architecture */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {problems.map((item) => (
            <div
              key={item.number}
              className="flex flex-col justify-between rounded-2xl border border-lp-border bg-white p-6 shadow-[0_4px_20px_rgba(24,23,22,0.03)] transition-all duration-150 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(24,23,22,0.06)] sm:p-8"
            >
              <div>
                <div className="flex items-center justify-between border-b border-lp-border/80 pb-4">
                  <span className="font-mono text-xs font-semibold tracking-wider text-lp-muted">
                    {item.number}
                  </span>
                  <span className="rounded-md bg-lp-surface px-2.5 py-0.5 font-mono text-[10px] font-medium text-lp-body">
                    {item.badge}
                  </span>
                </div>
                <h3 className="mt-5 font-ui text-lg font-bold leading-snug text-lp-ink">
                  {item.title}
                </h3>
                <p className="mt-3 font-ui text-sm leading-relaxed text-lp-body">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-lp-border/60 bg-lp-surface/40 p-3.5 font-ui text-xs leading-relaxed text-lp-muted">
                {item.detail}
              </div>
            </div>
          ))}
        </div>

        {/* Takeaway Manifesto Banner */}
        <div className="mt-12 rounded-2xl border border-lp-border bg-white p-6 text-center sm:p-8">
          <p className="font-ui text-[16px] font-semibold text-lp-ink sm:text-[17px]">
            You don&apos;t need another place to send applications. You need a better way to manage
            the decisions behind them.
          </p>
        </div>
      </div>
    </section>
  );
}

