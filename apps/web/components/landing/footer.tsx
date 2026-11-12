import Link from "next/link";

const COLUMNS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: "Product",
    links: [
      { href: "#opportunities", label: "Opportunities" },
      { href: "#adaptive-resume", label: "Resume Intelligence" },
      { href: "#tracking", label: "Application Tracking" },
      { href: "#how-it-works", label: "How it works" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#philosophy", label: "About" },
      { href: "mailto:hello@applypilot.app", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/signup", label: "Create account" },
      { href: "/sitemap", label: "Sitemap" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-lp-border bg-lp-bg">
      <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lp-ink font-ui text-xs font-semibold tracking-tight text-white">
                AP
              </span>
              <span className="font-ui text-[17px] font-semibold tracking-tight text-lp-ink">
                ApplyPilot
              </span>
            </Link>
            <p className="mt-3 max-w-xs font-ui text-sm leading-relaxed text-lp-muted">
              A more considered way to navigate your career.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="font-ui text-xs font-semibold uppercase tracking-wider text-lp-ink">
                {column.title}
              </p>
              <ul className="mt-3.5 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-ui text-sm text-lp-muted transition-colors duration-150 hover:text-lp-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col justify-between gap-2 border-t border-lp-border pt-6 font-ui text-xs text-lp-muted sm:flex-row sm:items-center">
          <p>© 2026 ApplyPilot · Built for better career decisions.</p>
          <p>Better career decisions, not more applications.</p>
        </div>
      </div>
    </footer>
  );
}
