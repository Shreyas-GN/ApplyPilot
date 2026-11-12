import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section className="bg-lp-bg py-16 sm:py-20">
      <div className="mx-auto max-w-[1040px] px-5 sm:px-8">
        <div className="rounded-[32px] border border-lp-border bg-white px-6 py-14 text-center shadow-[0_12px_40px_rgba(43,35,32,0.06)] sm:px-12 sm:py-20">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-lp-wine font-ui text-sm font-bold text-white shadow-xs">
            AP
          </div>
          <h2 className="mx-auto mt-5 max-w-[680px] font-ui text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-lp-ink sm:text-[46px]">
            Make your next move a considered one.
          </h2>
          <p className="mx-auto mt-4 max-w-[520px] font-ui text-[16px] leading-[1.65] text-lp-body">
            Bring your experience together. Find opportunities worth pursuing. Prepare every
            application with intention.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-lp-wine px-7 font-ui text-sm font-semibold text-white shadow-[0_4px_14px_rgba(236,90,56,0.28)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-lp-wine-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-wine"
            >
              Get started with ApplyPilot
              <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-lp-border bg-white px-6 font-ui text-sm font-semibold text-lp-ink transition-colors hover:bg-lp-surface"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-4 font-ui text-xs text-lp-muted">
            Free account creation · No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}
