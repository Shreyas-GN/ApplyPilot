"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ap-line/80 bg-ap-paper/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:h-[72px] sm:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ap-ink text-ap-paper font-display text-sm font-semibold transition-transform duration-150 group-hover:scale-105">
            AP
          </span>
          <span className="font-display text-xl text-ap-ink">ApplyPilot</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-ui text-sm text-ap-body transition-colors duration-150 hover:text-ap-ink hover:underline decoration-ap-vermilion decoration-2 underline-offset-8"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="font-ui text-sm font-medium text-ap-body transition-colors duration-150 hover:text-ap-ink px-3 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-1.5 rounded-button bg-ap-ink px-5 py-2.5 font-ui text-sm font-medium text-ap-paper shadow-2xs transition-all duration-150 hover:bg-ap-ink/90 hover:shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-vermilion"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-11 w-11 items-center justify-center rounded-full text-ap-ink md:hidden hover:bg-ap-surface-muted transition-colors"
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
            className="overflow-hidden border-t border-ap-line bg-ap-paper/95 backdrop-blur-md px-5 py-4 md:hidden"
          >
            <ul className="flex flex-col gap-1">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-2 py-3 font-ui text-base text-ap-body hover:bg-ap-surface-muted hover:text-ap-ink transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-col gap-2 border-t border-ap-line pt-3">
              <Link
                href="/login"
                className="rounded-button border border-ap-line px-5 py-3 text-center font-ui text-sm font-medium text-ap-ink hover:bg-ap-surface-muted"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-button bg-ap-ink px-5 py-3 text-center font-ui text-sm font-medium text-ap-paper hover:bg-ap-ink/90"
              >
                Get started
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
