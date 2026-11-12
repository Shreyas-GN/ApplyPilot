export function ProblemSection() {
  const columns = [
    {
      number: "01",
      title: "Too many opportunities, too little clarity",
      description:
        "Finding a vacancy doesn't tell you whether it's actually right for your experience.",
    },
    {
      number: "02",
      title: "One resume doesn't fit every role",
      description:
        "Different jobs need different emphasis on your experience, skills and projects.",
    },
    {
      number: "03",
      title: "Applications become difficult to manage",
      description:
        "Multiple websites, different resume versions, follow-ups and interview updates.",
    },
  ];

  return (
    <section className="border-b border-lp-border bg-lp-surface py-20 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="max-w-[720px]">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-lp-accent">
            The way we apply needs a better approach
          </p>
          <h2 className="mt-3 font-ui text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] text-lp-ink sm:text-[38px]">
            Finding a job is one thing. Getting your application right is another.
          </h2>
          <p className="mt-4 font-ui text-[16px] leading-[1.65] text-lp-body">
            The job search is scattered across job boards, company websites, resumes, spreadsheets
            and endless application forms. Every opportunity requires decisions. Every application
            needs preparation. And keeping track of it all can become a job in itself.
          </p>
        </div>

        {/* Three editorial columns — no oversized decorative cards */}
        <div className="mt-12 grid gap-10 border-t border-lp-border pt-10 md:grid-cols-3 md:gap-12">
          {columns.map((col) => (
            <div key={col.number}>
              <span className="font-mono text-xs font-medium text-lp-muted">{col.number}</span>
              <h3 className="mt-2.5 font-ui text-lg font-semibold leading-snug text-lp-ink">
                {col.title}
              </h3>
              <p className="mt-2 font-ui text-[15px] leading-relaxed text-lp-body">
                {col.description}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-12 border-t border-lp-border pt-8 font-ui text-[16px] font-medium text-lp-ink sm:text-[17px]">
          You don&apos;t need another place to send applications. You need a better way to manage
          the decisions behind them.
        </p>
      </div>
    </section>
  );
}

