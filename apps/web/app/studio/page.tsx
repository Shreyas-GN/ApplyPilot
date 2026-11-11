"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { MyResumesPanel } from "@/components/studio/my-resumes-panel";
import { TailoringStudioPanel } from "@/components/studio/tailoring-studio-panel";

type StudioTab = "resumes" | "tailored" | "cover-letters";

const TABS: { id: StudioTab; label: string; description: string }[] = [
  {
    id: "resumes",
    label: "My Resumes",
    description: "Upload PDF or DOCX versions, set your primary resume, and review parsed facts.",
  },
  {
    id: "tailored",
    label: "Tailored Resumes",
    description: "Reorganize and tailor your verified experience and skills for a target role.",
  },
  {
    id: "cover-letters",
    label: "Cover Letters",
    description: "Draft role-specific cover letters grounded strictly in your verified profile.",
  },
];

export default function StudioPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white" />}>
          <StudioContent />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}

function StudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const rawType = searchParams.get("type");

  let activeTab: StudioTab = "resumes";
  if (rawTab === "tailored" || rawTab === "cover-letters" || rawTab === "resumes") {
    activeTab = rawTab;
  } else if (rawType === "cover_letter") {
    activeTab = "cover-letters";
  } else if (searchParams.get("jobId") || searchParams.get("applicationId")) {
    activeTab = "tailored";
  }

  function handleTabChange(nextTab: StudioTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    params.delete("type");
    router.replace(`/studio?${params.toString()}`);
  }

  const currentTabMeta = TABS.find((t) => t.id === activeTab);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Resume Studio</h1>
        <p className="mt-1 text-sm text-slate-500">{currentTabMeta?.description}</p>
      </div>

      <div
        role="tablist"
        aria-label="Resume Studio sections"
        className="flex flex-wrap gap-1 border-b border-slate-200"
      >
        {TABS.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => handleTabChange(tab.id)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                selected
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "resumes" && <MyResumesPanel embedded />}
      {activeTab === "tailored" && (
        <TailoringStudioPanel key="tailored" mode="resume" embedded />
      )}
      {activeTab === "cover-letters" && (
        <TailoringStudioPanel key="cover-letters" mode="cover_letter" embedded />
      )}
    </div>
  );
}
