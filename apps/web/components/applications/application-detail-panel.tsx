"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  Sparkles,
  X,
} from "lucide-react";
import type {
  ApplicationChecklistState,
  ApplicationDto,
  ApplicationStatus,
  ScreeningAnswerResult,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api-client";

const STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "phone_screen",
  "interviewing",
  "background_check",
  "offer",
  "rejected",
  "withdrawn",
];

const QUICK_PROMPTS = [
  "Why are you interested in this role?",
  "Tell us about a challenging technical project you delivered.",
  "How does your experience align with the core skills for this position?",
];

export function ApplicationDetailPanel({
  application,
  onClose,
  onUpdated,
  onDelete,
}: {
  application: ApplicationDto;
  onClose: () => void;
  onUpdated: (next: ApplicationDto) => void;
  onDelete: (id: string) => void;
}) {
  const [notes, setNotes] = useState(application.notes ?? "");
  const [followUpDate, setFollowUpDate] = useState(
    application.followUpAt ? application.followUpAt.slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Screening question assistant
  const [question, setQuestion] = useState("");
  const [answering, setAnswering] = useState(false);
  const [screeningResult, setScreeningResult] = useState<ScreeningAnswerResult | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  async function patchApp(payload: Record<string, unknown>, message?: string) {
    setSaving(true);
    setError(null);
    setSaveNotice(null);
    try {
      const updated = await api.patch<ApplicationDto>(
        `/applications/${application.id}`,
        payload
      );
      onUpdated(updated);
      if (message) setSaveNotice(message);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to update application.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNotesAndReminder(e: FormEvent) {
    e.preventDefault();
    await patchApp(
      {
        notes,
        followUpAt: followUpDate ? new Date(`${followUpDate}T09:00:00Z`).toISOString() : null,
      },
      "Saved notes & follow-up reminder."
    );
  }

  async function handleToggleChecklist(
    key: keyof ApplicationChecklistState,
    value: boolean
  ) {
    await patchApp({ checklist: { [key]: value } });
  }

  async function handleAnswerQuestion(e: FormEvent) {
    e.preventDefault();
    if (question.trim().length < 3) return;
    setAnswering(true);
    setError(null);
    setCopiedAnswer(false);
    try {
      const res = await api.post<ScreeningAnswerResult>("/tailor/screening", {
        question: question.trim(),
        applicationId: application.id,
        jobId: application.jobId ?? undefined,
        company: application.company,
        jobTitle: application.title,
      });
      setScreeningResult(res);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : "Failed to draft screening answer."
      );
    } finally {
      setAnswering(false);
    }
  }

  const readiness = application.readiness;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-ui-ink/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="relative z-10 flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ui-border bg-white px-6 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-ui-ink">
                {application.title}
              </h2>
              <StatusBadge status={application.status} />
            </div>
            <p className="mt-0.5 text-sm text-ui-body">
              {application.company}
              {application.location ? ` · ${application.location}` : ""}
              {application.matchScore !== null ? ` · ${application.matchScore}% match` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close application details"
            className="rounded-lg p-1.5 text-ui-muted hover:bg-ui-linen hover:text-ui-body"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-6 p-6">
          {error && <Alert tone="error">{error}</Alert>}
          {saveNotice && <Alert tone="success">{saveNotice}</Alert>}

          {/* Stage & Quick Links */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ui-border bg-ui-canvas/60 p-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-ui-muted">
                Stage
              </label>
              <select
                value={application.status}
                disabled={saving}
                onChange={(e) =>
                  patchApp(
                    { status: e.target.value as ApplicationStatus },
                    "Stage updated."
                  )
                }
                className="rounded-lg border border-ui-border bg-white px-2.5 py-1.5 text-xs font-medium text-ui-ink focus:border-ui-violet focus:outline-none"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {application.jobId && (
                <Link href={`/jobs/${application.jobId}`}>
                  <Button variant="secondary" className="px-3 py-1.5 text-xs">
                    Job Intelligence
                  </Button>
                </Link>
              )}
              <Link href={`/studio?tab=tailored&applicationId=${application.id}`}>
                <Button variant="secondary" className="px-3 py-1.5 text-xs">
                  Tailor Resume
                </Button>
              </Link>
              <Link href={`/studio?tab=cover-letters&applicationId=${application.id}`}>
                <Button variant="secondary" className="px-3 py-1.5 text-xs">
                  Cover Letter
                </Button>
              </Link>
              {application.url && (
                <a
                  href={application.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-ui-border bg-white px-2.5 py-1.5 text-xs font-medium text-ui-ink hover:bg-ui-canvas"
                >
                  <span>Posting</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {/* Application Readiness Checklist */}
          {readiness && (
            <div className="rounded-xl border border-ui-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-ui-ink">
                    Application Readiness Checklist
                  </h3>
                  <p className="text-xs text-ui-muted">
                    Verify materials and final answers before submitting.
                  </p>
                </div>
                <Badge
                  className={
                    readiness.completedCount === readiness.totalCount
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-ui-lilac-soft text-ui-violet"
                  }
                >
                  {`${readiness.completedCount}/${readiness.totalCount} ready`}
                </Badge>
              </div>

              <ul className="flex flex-col gap-2 text-xs">
                <li className="flex items-center justify-between gap-2 text-ui-ink">
                  <span className="flex items-center gap-2">
                    {readiness.profileComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300" />
                    )}
                    <span>Candidate profile is at least 70% complete</span>
                  </span>
                  {!readiness.profileComplete && (
                    <Link href="/profile" className="font-medium text-ui-violet hover:underline">
                      Complete profile
                    </Link>
                  )}
                </li>
                <li className="flex items-center justify-between gap-2 text-ui-ink">
                  <span className="flex items-center gap-2">
                    {readiness.hasResume ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300" />
                    )}
                    <span>Base resume uploaded</span>
                  </span>
                  {!readiness.hasResume && (
                    <Link
                      href="/studio?tab=resumes"
                      className="font-medium text-ui-violet hover:underline"
                    >
                      Upload resume
                    </Link>
                  )}
                </li>
                <li className="flex items-center justify-between gap-2 text-ui-ink">
                  <span className="flex items-center gap-2">
                    {readiness.tailoredResume ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300" />
                    )}
                    <span>Tailored resume created for this role</span>
                  </span>
                  {!readiness.tailoredResume && (
                    <Link
                      href={`/studio?tab=tailored&applicationId=${application.id}`}
                      className="font-medium text-ui-violet hover:underline"
                    >
                      Tailor now
                    </Link>
                  )}
                </li>
                <li className="flex items-center justify-between gap-2 text-ui-ink">
                  <span className="flex items-center gap-2">
                    {readiness.coverLetter ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300" />
                    )}
                    <span>Cover letter drafted for this role</span>
                  </span>
                  {!readiness.coverLetter && (
                    <Link
                      href={`/studio?tab=cover-letters&applicationId=${application.id}`}
                      className="font-medium text-ui-violet hover:underline"
                    >
                      Draft letter
                    </Link>
                  )}
                </li>
                <li>
                  <label className="flex cursor-pointer items-center gap-2 text-ui-ink">
                    <input
                      type="checkbox"
                      checked={readiness.screeningPrepared}
                      disabled={saving}
                      onChange={(e) =>
                        handleToggleChecklist("screeningPrepared", e.target.checked)
                      }
                      className="rounded border-ui-border text-ui-violet focus:ring-brand-500"
                    />
                    <span>Screening answers prepared and grounded</span>
                  </label>
                </li>
                <li>
                  <label className="flex cursor-pointer items-center gap-2 text-ui-ink">
                    <input
                      type="checkbox"
                      checked={readiness.finalReviewed}
                      disabled={saving}
                      onChange={(e) =>
                        handleToggleChecklist("finalReviewed", e.target.checked)
                      }
                      className="rounded border-ui-border text-ui-violet focus:ring-brand-500"
                    />
                    <span>Final application details verified before submission</span>
                  </label>
                </li>
              </ul>
            </div>
          )}

          {/* Notes & Follow-up Reminder */}
          <form
            onSubmit={handleSaveNotesAndReminder}
            className="flex flex-col gap-4 rounded-xl border border-ui-border p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-ui-violet" />
                <h3 className="text-sm font-semibold text-ui-ink">
                  Notes & Follow-up Reminder
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  aria-label="Follow-up reminder date"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="rounded-lg border border-ui-border px-2.5 py-1 text-xs text-ui-ink focus:border-ui-violet focus:outline-none"
                />
                {followUpDate && (
                  <button
                    type="button"
                    onClick={() => setFollowUpDate("")}
                    className="text-xs text-ui-muted hover:text-ui-ink"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Recruiter contacts, interview notes, compensation notes, next steps..."
              className="w-full rounded-lg border border-ui-border p-2.5 text-sm text-ui-ink focus:border-ui-violet focus:outline-none"
            />

            <div className="flex items-center justify-between">
              <Button type="submit" className="px-3 py-1.5 text-xs" loading={saving}>
                Save notes & reminder
              </Button>
              <button
                type="button"
                onClick={() => onDelete(application.id)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Delete application
              </button>
            </div>
          </form>

          {/* Screening Question Assistant */}
          <div className="flex flex-col gap-3 rounded-xl border border-ui-border p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ui-violet" />
              <h3 className="text-sm font-semibold text-ui-ink">
                Screening Question Assistant
              </h3>
            </div>
            <p className="text-xs text-ui-muted">
              Generate concise answers strictly grounded in your verified profile for this application.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setQuestion(prompt)}
                  className="rounded-full border border-ui-border bg-ui-canvas px-2.5 py-1 text-left text-[11px] text-ui-ink hover:bg-ui-linen"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={handleAnswerQuestion} className="flex flex-col gap-2">
              <textarea
                rows={2}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Paste a screening question from the application form..."
                className="w-full rounded-lg border border-ui-border p-2.5 text-sm text-ui-ink focus:border-ui-violet focus:outline-none"
              />
              <div>
                <Button type="submit" className="px-3 py-1.5 text-xs" loading={answering}>
                  Draft grounded answer
                </Button>
              </div>
            </form>

            {screeningResult && (
              <div className="rounded-lg border border-ui-lilac bg-ui-lilac-soft/40 p-3">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ui-violet">
                    Suggested Answer
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(screeningResult.answer);
                      setCopiedAnswer(true);
                    }}
                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-ui-violet hover:bg-brand-100"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedAnswer ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ui-ink">
                  {screeningResult.answer}
                </p>
                {screeningResult.groundedFacts.length > 0 && (
                  <p className="mt-2 text-[11px] text-ui-muted">
                    Grounded in: {screeningResult.groundedFacts.join(" · ")}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Application History */}
          <div className="rounded-xl border border-ui-border p-4">
            <h3 className="mb-2.5 text-sm font-semibold text-ui-ink">
              Application History
            </h3>
            {application.events && application.events.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {application.events.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-start justify-between gap-3 text-xs text-ui-body"
                  >
                    <span>• {ev.description}</span>
                    <span className="shrink-0 text-ui-muted">
                      {new Date(ev.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ui-muted">No history events recorded yet.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

