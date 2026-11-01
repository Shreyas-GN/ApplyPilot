import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { UnderlineAnnotation } from "./annotation";

const EVIDENCE = [
  {
    icon: CheckCircle2,
    tone: "text-ap-sage",
    label: "Skills that align",
    body: "Python, FastAPI and REST API experience already on the profile.",
  },
  {
    icon: AlertCircle,
    tone: "text-ap-vermilion",
    label: "Requirements not yet demonstrated",
    body: "Relational-database depth isn't clearly shown yet.",
  },
  {
    icon: HelpCircle,
    tone: "text-ap-muted",
    label: "Not enough information",
    body: "No signal on production on-call experience.",
  },
];

export function Differentiation() {
  return (
    <section className="bg-ap-paper-deep py-16 sm:py-24 lg:py-28">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16">
        <div>
          <h2 className="relative inline-block font-display text-[32px] leading-[1.1] text-ap-ink sm:text-[40px]">
            More applications aren&apos;t always better.
            <UnderlineAnnotation className="absolute -bottom-2 left-0 h-3 w-40 text-ap-vermilion" />
          </h2>
          <p className="mt-6 max-w-sm font-ui text-[15px] leading-relaxed text-ap-body">
            A useful job search is about spending effort on roles that make sense, understanding
            why they fit, and preparing applications with care — not applying to everything you
            can find.
          </p>
        </div>

        <div className="rounded-panel border border-ap-line bg-ap-surface p-6 sm:p-8">
          <p className="font-ui text-sm font-medium text-ap-ink">Fit summary — Backend Engineer, Northstar Systems</p>
          <ul className="mt-5 space-y-4">
            {EVIDENCE.map(({ icon: Icon, tone, label, body }) => (
              <li key={label} className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${tone}`} strokeWidth={1.75} aria-hidden="true" />
                <div className="font-ui text-[14px] leading-relaxed text-ap-body">
                  <span className="font-medium text-ap-ink">{label} — </span>
                  {body}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 font-mono text-[11px] text-ap-muted">
            Illustrative match evidence — shown as reasoning, not a score.
          </p>
        </div>
      </div>
    </section>
  );
}
