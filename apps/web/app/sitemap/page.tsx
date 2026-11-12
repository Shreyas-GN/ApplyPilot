import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Complete directory of ApplyPilot workspace routes and pages.",
};

const WORKSPACE_SECTIONS: Array<{
  title: string;
  description: string;
  links: Array<{ href: string; label: string }>;
}> = [
  {
    title: "Dashboard",
    description: "Profile completion, recommended opportunities, and recent activity.",
    links: [
      { href: "/dashboard", label: "Overview" },
      { href: "/jobs", label: "Recommended opportunities" },
    ],
  },
  {
    title: "Discover Jobs",
    description: "Personalized feed, search filters, adjacent-role discovery, and saved jobs.",
    links: [
      { href: "/jobs?tab=for-you", label: "For You" },
      { href: "/jobs?tab=search", label: "Search Jobs" },
      { href: "/jobs?tab=adjacent", label: "Explore Adjacent Roles" },
      { href: "/jobs?tab=saved", label: "Saved Jobs" },
    ],
  },
  {
    title: "Applications",
    description: "Track pipeline progress in List and Kanban views with reminders and checklists.",
    links: [
      { href: "/applications?view=list", label: "All Applications" },
      { href: "/applications?view=board", label: "Kanban Board" },
    ],
  },
  {
    title: "Resume Studio",
    description: "Manage resume versions, tailor for specific roles, and generate cover letters.",
    links: [
      { href: "/studio?tab=resumes", label: "My Resumes" },
      { href: "/studio?tab=tailored", label: "Tailored Resumes & Cover Letters" },
    ],
  },
  {
    title: "Browser Copilot",
    description: "Chrome extension pairing, ATS detection, autofill, and activity history.",
    links: [
      { href: "/copilot", label: "Extension Setup & Activity" },
      { href: "/settings?tab=extension", label: "Extension Pairing" },
    ],
  },
  {
    title: "Profile",
    description: "Structured personal details, experience, education, skills, projects, and preferences.",
    links: [
      { href: "/profile", label: "Personal Details, Skills & Preferences" },
      { href: "/onboarding", label: "Onboarding Setup" },
    ],
  },
  {
    title: "Settings",
    description: "Account controls, notifications, data export/deletion, and extension pairing.",
    links: [
      { href: "/settings?tab=account", label: "Account" },
      { href: "/settings?tab=notifications", label: "Notifications" },
      { href: "/settings?tab=privacy", label: "Privacy & Data" },
      { href: "/settings?tab=extension", label: "Extension Pairing" },
    ],
  },
  {
    title: "Public & Auth",
    description: "Sign in, account creation, legal policies, and XML sitemap.",
    links: [
      { href: "/", label: "Home" },
      { href: "/login", label: "Log in" },
      { href: "/signup", label: "Create account" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <main className="min-h-screen bg-ui-canvas px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm font-semibold text-ui-violet hover:underline">
              ← Back to ApplyPilot
            </Link>
            <h1 className="mt-2 text-3xl font-semibold text-ui-ink">ApplyPilot Sitemap</h1>
            <p className="mt-1 text-sm text-ui-body">
              All workspace destinations, discovery tabs, and account pages.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg bg-ui-wine px-4 py-2 text-sm font-medium text-white hover:bg-ui-wine-hover"
          >
            Open workspace
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WORKSPACE_SECTIONS.map((section) => (
            <Card key={section.title}>
              <h2 className="text-base font-semibold text-ui-ink">{section.title}</h2>
              <p className="mt-1 text-xs text-ui-muted">{section.description}</p>
              <ul className="mt-4 flex flex-col gap-2 text-sm">
                {section.links.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-ui-violet hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

