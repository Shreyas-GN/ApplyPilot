import Link from "next/link";

const COLUMNS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: "Product",
    links: [
      { href: "#product", label: "Product" },
      { href: "#how-it-works", label: "How it works" },
      { href: "#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "mailto:hello@applypilot.app", label: "Contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/signup", label: "Create account" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-ap-line bg-ap-paper">
      <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2">
            <Link href="/" className="font-display text-xl text-ap-ink">
              ApplyPilot
            </Link>
            <p className="mt-3 max-w-xs font-ui text-sm text-ap-muted">
              Find better jobs. Apply smarter.
            </p>
          </div>
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="font-ui text-[13px] font-medium text-ap-ink">{column.title}</p>
              <ul className="mt-3 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-ui text-sm text-ap-muted transition-colors duration-150 hover:text-ap-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-12 font-mono text-[12px] text-ap-muted">
          © {new Date().getFullYear()} ApplyPilot.
        </p>
      </div>
    </footer>
  );
}
