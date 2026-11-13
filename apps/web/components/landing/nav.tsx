"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#opportunities", label: "Opportunities" },
  { href: "#adaptive-resume", label: "Resume Engine" },
  { href: "#tracking", label: "Tracking" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-lp-border bg-lp-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lp-wine font-ui text-xs font-semibold tracking-tight text-white transition-transform duration-150 group-hover:scale-105">
            AP
          </span>
          <span className="font-ui text-[17px] font-semibold tracking-tight text-lp-ink">
            ApplyFocus
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-ui text-sm font-medium text-lp-body transition-colors duration-150 hover:text-lp-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lp-accent"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 font-ui text-sm font-medium text-lp-body transition-colors duration-150 hover:text-lp-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-1.5 rounded-xl bg-lp-wine px-4 py-2 font-ui text-sm font-medium text-white shadow-xs transition-all duration-150 hover:bg-lp-wine-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-wine"
          >
            Get started — it&apos;s free
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-lp-ink transition-colors hover:bg-lp-surface md:hidden"
        >
          {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="Primary"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-lp-border bg-lp-bg px-5 py-4 md:hidden"
          >
            <ul className="flex flex-col gap-1">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 font-ui text-base font-medium text-lp-body transition-colors hover:bg-lp-surface hover:text-lp-ink"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-2.5 border-t border-lp-border pt-4">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-lp-border px-4 py-2.5 text-center font-ui text-sm font-medium text-lp-ink transition-colors hover:bg-lp-surface"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-lp-wine px-4 py-2.5 text-center font-ui text-sm font-medium text-white transition-colors hover:bg-lp-wine-hover"
              >
                Get started — it&apos;s free
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
