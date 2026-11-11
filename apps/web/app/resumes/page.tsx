"use client";

import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { MyResumesPanel } from "@/components/studio/my-resumes-panel";

export default function ResumesPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <MyResumesPanel />
      </AppShell>
    </ProtectedRoute>
  );
}
