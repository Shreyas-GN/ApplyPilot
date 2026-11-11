"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ComponentType, type ReactNode } from "react";
import {
  Bot,
  Briefcase,
  Compass,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  matchPrefixes?: string[];
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Discover Jobs", icon: Compass },
  { href: "/applications", label: "Applications", icon: Briefcase },
  {
    href: "/studio",
    label: "Resume Studio",
    icon: FileText,
    matchPrefixes: ["/studio", "/resumes", "/tailor"],
  },
  { href: "/profile", label: "Profile", icon: User },
];

const SECONDARY_NAV_ITEMS: NavItem[] = [
  { href: "/copilot", label: "Browser Copilot", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isNavItemActive(pathname: string | null, item: NavItem): boolean {
  if (!pathname) return false;
  const prefixes = item.matchPrefixes ?? [item.href];
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  function renderNavList(items: NavItem[], onNavigate?: () => void) {
    return (
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active = isNavItemActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-brand-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  const sidebarContent = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col justify-between px-4 py-5">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-2">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="text-lg font-semibold tracking-tight text-brand-700"
          >
            ApplyPilot
          </Link>
          {onNavigate && (
            <button
              type="button"
              onClick={onNavigate}
              aria-label="Close navigation"
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <nav aria-label="Primary navigation">{renderNavList(PRIMARY_NAV_ITEMS, onNavigate)}</nav>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-200 pt-4">
        <nav aria-label="Utilities navigation">
          {renderNavList(SECONDARY_NAV_ITEMS, onNavigate)}
        </nav>

        <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <span className="min-w-0 truncate text-xs text-slate-600" title={user?.email}>
            {user?.email}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <Link href="/dashboard" className="text-lg font-semibold text-brand-700">
          ApplyPilot
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 flex w-64 max-w-[80vw] flex-col border-r border-slate-200 bg-white">
            {sidebarContent(() => setMobileOpen(false))}
          </aside>
        </div>
      )}

      {/* Desktop sticky sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:sticky md:top-0 md:flex md:h-screen md:flex-col">
        {sidebarContent()}
      </aside>

      {/* Main content area */}
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
