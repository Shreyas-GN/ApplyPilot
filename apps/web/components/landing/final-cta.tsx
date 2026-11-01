import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CircleAnnotation } from "./annotation";

export function FinalCta() {
  return (
    <section className="bg-ap-paper-deep py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[700px] px-5 text-center sm:px-8">
        <div className="relative inline-block">
          <h2 className="font-display text-[32px] leading-[1.1] text-ap-ink sm:text-[44px]">
            Make your next move a considered one.
          </h2>
          <CircleAnnotation className="pointer-events-none absolute -right-8 -top-6 hidden h-12 w-24 text-ap-vermilion sm:block" />
        </div>
        <p className="mx-auto mt-5 max-w-md font-ui text-[16px] leading-relaxed text-ap-body">
          Start with your profile. Build a job search that feels more organised, focused and
          manageable.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-button bg-ap-ink px-7 font-ui text-sm font-medium text-ap-paper transition-colors duration-150 hover:bg-ap-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-vermilion"
        >
          Get started
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
