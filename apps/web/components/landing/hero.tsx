import Link from "next/link";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { ArrowAnnotation } from "./annotation";
import { PreviewBadge } from "./preview-badge";
import { ProductWindow, Tag, StatusDot } from "./product-window";
import { sampleOpportunityList } from "./sample-data";

export function Hero() {
  const selected = sampleOpportunityList[0]!;

  return (
    <section className="relative overflow-hidden bg-ap-paper">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,480px)_1fr] lg:items-center lg:gap-16 lg:py-28">
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-ap-vermilion">
            Your next opportunity, with a plan
          </p>
          <h1 className="mt-4 font-display text-[42px] leading-[1.05] text-ap-ink sm:text-[56px] lg:text-[68px]">
            Find better jobs.
            <br />
            Apply smarter.
          </h1>
          <p className="mt-5 max-w-md font-ui text-lg leading-relaxed text-ap-body">
            ApplyPilot brings your job search into one place — helping you understand fit,
            prepare thoughtful applications and stay on top of every next step.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-button bg-ap-ink px-6 font-ui text-sm font-medium text-ap-paper transition-colors duration-150 hover:bg-ap-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-vermilion"
            >
              Get started
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-button border border-ap-line px-6 font-ui text-sm font-medium text-ap-ink transition-colors duration-150 hover:bg-ap-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-vermilion"
            >
              See how it works
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="hidden lg:block">
            <ArrowAnnotation className="absolute -left-10 top-6 h-14 w-20 -scale-x-100 text-ap-vermilion" />
          </div>

          <ProductWindow title="Opportunity workspace" icon={Search} badge={<PreviewBadge label="Product preview" />}>
            <ul className="divide-y divide-ap-line">
              {sampleOpportunityList.map((item) => (
                <li
                  key={`${item.company}-${item.role}`}
                  className={`flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 ${
                    item.selected ? "" : "opacity-60"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {item.selected && <StatusDot tone="vermilion" />}
                      <p className="truncate font-ui text-sm font-medium text-ap-ink">{item.role}</p>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 font-ui text-[13px] text-ap-muted">
                      {item.company}
                      <span aria-hidden="true">·</span>
                      <MapPin className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                      {item.location}
                    </p>
                  </div>
                  <div className="hidden flex-shrink-0 gap-1.5 sm:flex">
                    {item.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-card border border-ap-vermilion-soft bg-ap-vermilion-soft/40 p-3.5">
              <p className="font-ui text-[11px] font-medium uppercase tracking-wide text-ap-vermilion">
                Why this fits
              </p>
              <p className="mt-1.5 font-ui text-[13px] leading-relaxed text-ap-body">
                {selected.role} at {selected.company} aligns on Python and FastAPI — the core
                skills on Asha&apos;s profile.
              </p>
            </div>
          </ProductWindow>
        </div>
      </div>
    </section>
  );
}
