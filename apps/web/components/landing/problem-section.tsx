export function ProblemSection() {
  const pillars = [
    {
      title: "Master Profile",
      description: "One structured source of truth for skills & impact.",
      bg: "bg-lp-peach",
      dot: "bg-lp-wine",
      previewTitle: "Verified Experience",
      previewMeta: "12 skills · 4 roles",
    },
    {
      title: "Fit Scoring",
      description: "See honest alignment & gaps before you apply.",
      bg: "bg-lp-accent-soft",
      dot: "bg-lp-accent",
      previewTitle: "92% Role Fit",
      previewMeta: "2 strong signals",
    },
    {
      title: "Adaptive Resume",
      description: "Tailored bullets grounded in real evidence.",
      bg: "bg-lp-sage",
      dot: "bg-emerald-600",
      previewTitle: "Resume v3 · Tailored",
      previewMeta: "Approved by you",
    },
    {
      title: "Companion",
      description: "Prepare screening answers on employer sites.",
      bg: "bg-amber-50",
      dot: "bg-amber-600",
      previewTitle: "Drafted Response",
      previewMeta: "Ready to review",
    },
    {
      title: "Pipeline Tracker",
      description: "Follow every stage, version & next step.",
      bg: "bg-stone-100",
      dot: "bg-[#141413]",
      previewTitle: "Interview Stage",
      previewMeta: "3 active roles",
    },
  ];

  return (
    <section className="border-b border-lp-border bg-lp-bg py-20 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="max-w-[680px]">
          <h2 className="font-ui text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-lp-ink sm:text-[42px]">
            Everything your search needs.
            <span className="block text-lp-muted">Nothing it doesn&apos;t.</span>
          </h2>
          <p className="mt-4 font-ui text-[16px] leading-[1.6] text-lp-body">
            The job search shouldn&apos;t live across scattered job boards, disconnected resume
            files, and messy spreadsheets.
          </p>
        </div>

        {/* HeyRetro-style 5-card horizontal illustrated strip */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {pillars.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-lp-border bg-white p-3 shadow-[0_2px_10px_rgba(43,35,32,0.03)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(43,35,32,0.07)]"
            >
              <div className={`flex h-28 flex-col justify-between rounded-xl p-3.5 ${item.bg}`}>
                <div className="flex items-center justify-between">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                  <span className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-[10px] font-medium text-lp-ink">
                    Live
                  </span>
                </div>
                <div className="rounded-lg bg-white/95 p-2 shadow-2xs">
                  <p className="font-ui text-[11px] font-semibold text-lp-ink">
                    {item.previewTitle}
                  </p>
                  <p className="font-mono text-[10px] text-lp-muted">{item.previewMeta}</p>
                </div>
              </div>
              <div className="px-1 pt-3 pb-1">
                <h3 className="font-ui text-sm font-semibold text-lp-ink">{item.title}</h3>
                <p className="mt-1 font-ui text-xs leading-relaxed text-lp-body">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

