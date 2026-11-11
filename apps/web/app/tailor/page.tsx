"use client";

import { Suspense } from "react";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { TailoringStudioPanel } from "@/components/studio/tailoring-studio-panel";

export default function TailorPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white" />}>
          <TailoringStudioPanel mode="all" />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
