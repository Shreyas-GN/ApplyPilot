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
  Plus,
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

function getRouteLabel(pathname: string | null): string {
  const all = [...PRIMARY_NAV_ITEMS, ...SECONDARY_NAV_ITEMS];
  const matched = all.find((item) => isNavItemActive(pathname, item));
  return matched?.label ?? "Workspace";
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
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "bg-ui-lilac-soft text-ui-ink"
                    : "text-ui-body hover:bg-ui-linen/70 hover:text-ui-ink"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${active ? "text-ui-violet" : "text-ui-muted"}`}
                />
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
            className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-violet"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ui-wine text-xs font-semibold tracking-tight text-white">
              AP
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-ui-ink">
              ApplyFocus
            </span>
          </Link>
          {onNavigate && (
            <button
              type="button"
              onClick={onNavigate}
              aria-label="Close navigation"
              className="rounded-lg p-1.5 text-ui-muted hover:bg-ui-linen hover:text-ui-ink md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div>
          <p className="mb-2 px-3 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-ui-muted">
            Workspace
          </p>
          <nav aria-label="Primary navigation">{renderNavList(PRIMARY_NAV_ITEMS, onNavigate)}</nav>
        </div>

        <div>
          <p className="mb-2 px-3 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-ui-muted">
            Tools
          </p>
          <nav aria-label="Utilities navigation">
            {renderNavList(SECONDARY_NAV_ITEMS, onNavigate)}
          </nav>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-ui-border pt-4">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-ui-border bg-ui-canvas px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ui-lilac-soft font-mono text-[11px] font-semibold text-ui-violet">
              {user?.email?.charAt(0).toUpperCase() ?? "U"}
            </span>
            <span className="min-w-0 truncate text-xs font-medium text-ui-ink" title={user?.email}>
              {user?.email}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ui-body transition-colors hover:bg-ui-linen hover:text-ui-ink"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">Log out</span>
          </button>
        </div>
      </div>
    </div>
  );

  const routeLabel = getRouteLabel(pathname);

  return (
    <div className="flex min-h-screen flex-col bg-ui-canvas text-ui-ink md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-ui-border bg-ui-surface md:sticky md:top-0 md:block md:h-screen md:overflow-y-auto">
        {sidebarContent()}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-ui-ink/30 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 h-full w-72 border-r border-ui-border bg-ui-surface shadow-xl">
            {sidebarContent(() => setMobileOpen(false))}
          </aside>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky Translucent Context Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ui-border bg-ui-canvas/85 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="rounded-lg p-1.5 text-ui-body hover:bg-ui-linen hover:text-ui-ink md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-ui-muted">ApplyFocus</span>
              <span className="text-ui-border" aria-hidden="true">/</span>
              <span className="font-medium text-ui-ink">{routeLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/jobs"
              className="hidden rounded-lg px-3 py-1.5 text-xs font-medium text-ui-body transition-colors hover:bg-ui-linen hover:text-ui-ink sm:inline-flex"
            >
              Discover Jobs
            </Link>
            <Link
              href="/applications"
              className="inline-flex items-center gap-1.5 rounded-lg bg-ui-wine px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-ui-wine-hover"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Track Application</span>
            </Link>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
