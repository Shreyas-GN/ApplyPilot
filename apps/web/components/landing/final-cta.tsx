import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section className="bg-lp-ink py-20 text-white sm:py-28">
      <div className="mx-auto max-w-[740px] px-5 text-center sm:px-8">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-blue-400">
          Your next chapter starts here
        </p>
        <h2 className="mt-3 font-ui text-[32px] font-semibold leading-[1.12] tracking-[-0.02em] text-white sm:text-[44px]">
          Make your next move a considered one.
        </h2>
        <p className="mx-auto mt-4 max-w-[540px] font-ui text-[16px] leading-[1.65] text-gray-300">
          Bring your experience together. Find opportunities worth pursuing. Prepare every
          application with intention.
        </p>

        <div className="mt-8">
          <Link
            href="/signup"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-7 font-ui text-sm font-semibold text-lp-ink shadow-sm transition-all duration-150 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
          >
            Get started with ApplyPilot
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        <p className="mt-4 font-ui text-xs text-gray-400">
          Free account creation · No credit card required
        </p>
      </div>
    </section>
  );
}
