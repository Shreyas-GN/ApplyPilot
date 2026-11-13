"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import type {
  ApplicationDto,
  CoverLetterContent,
  CoverLetterTone,
  JobDto,
  TailoredDocumentDto,
  TailoredDocumentType,
  TailoredResumeContent,
} from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api-client";

function formatResumeAsText(doc: TailoredDocumentDto): string {
  const c = doc.content as TailoredResumeContent;
  const lines = [
    `# ${doc.jobTitle} — ${doc.company}`,
    "",
    `## ${c.headline}`,
    c.summary,
    "",
    `### Highlighted Skills`,
    c.highlightedSkills.join(", "),
    "",
    `### Experience`,
    ...c.experience.flatMap((exp) => [
      `**${exp.title}** — ${exp.company} (${exp.startDate ?? ""} – ${exp.endDate ?? "Present"})`,
      exp.tailoredDescription,
      "",
    ]),
  ];
  return lines.join("\n");
}

function formatCoverLetterAsText(doc: TailoredDocumentDto): string {
  const c = doc.content as CoverLetterContent;
  return [
    `Subject: ${c.subjectLine}`,
    "",
    c.greeting,
    "",
    ...c.bodyParagraphs.flatMap((p) => [p, ""]),
    c.closing,
    c.signature,
  ].join("\n");
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function TailoringStudioPanel({
  mode = "all",
  embedded = false,
}: {
  mode?: "all" | TailoredDocumentType;
  embedded?: boolean;
}) {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("jobId") ?? "";
  const initialAppId = searchParams.get("applicationId") ?? "";
  const paramType: TailoredDocumentType =
    searchParams.get("type") === "cover_letter" ? "cover_letter" : "resume";
  const initialDocType: TailoredDocumentType = mode === "all" ? paramType : mode;

  const [docs, setDocs] = useState<TailoredDocumentDto[]>([]);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [docType, setDocType] = useState<TailoredDocumentType>(initialDocType);
  const [tone, setTone] = useState<CoverLetterTone>("conversational");
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [selectedAppId, setSelectedAppId] = useState(initialAppId);
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [activeDoc, setActiveDoc] = useState<TailoredDocumentDto | null>(null);
  const [draftContent, setDraftContent] = useState<
    TailoredResumeContent | CoverLetterContent | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<TailoredDocumentDto[]>("/tailor"),
      api.get<JobDto[]>("/jobs?tab=saved"),
      api.get<ApplicationDto[]>("/applications"),
    ])
      .then(([loadedDocs, loadedJobs, loadedApps]) => {
        if (cancelled) return;
        const scopedDocs =
          mode === "all" ? loadedDocs : loadedDocs.filter((d) => d.type === mode);
        setDocs(scopedDocs);
        // Show saved jobs; fall back to all if none saved yet
        const savedJobs = loadedJobs.filter((j) => j.userState === "saved" || j.applicationStatus !== null);
        setJobs(savedJobs.length > 0 ? savedJobs : loadedJobs);
        setApplications(loadedApps);

        if (initialJobId) {
          const matched = loadedJobs.find((j) => j.id === initialJobId);
          if (matched) {
            setCompany(matched.company);
            setJobTitle(matched.title);
            setJobDescription(matched.description);
          }
        } else if (initialAppId) {
          const matchedApp = loadedApps.find((a) => a.id === initialAppId);
          if (matchedApp) {
            setCompany(matchedApp.company);
            setJobTitle(matchedApp.title);
            if (matchedApp.jobId) {
              setSelectedJobId(matchedApp.jobId);
              const linkedJob = loadedJobs.find((j) => j.id === matchedApp.jobId);
              if (linkedJob) setJobDescription(linkedJob.description);
            }
          }
        }

        const matchingDoc =
          (initialJobId && scopedDocs.find((d) => d.jobId === initialJobId)) ||
          (initialAppId && scopedDocs.find((d) => d.applicationId === initialAppId)) ||
          scopedDocs[0] ||
          null;
        if (matchingDoc) {
          setActiveDoc(matchingDoc);
          setDraftContent(matchingDoc.content);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.detail : "Failed to load tailoring workspace."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialAppId, initialJobId, mode]);

  function handleSelectSavedJob(jobId: string) {
    setSelectedJobId(jobId);
    setSelectedAppId("");
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setCompany(job.company);
      setJobTitle(job.title);
      setJobDescription(job.description);
      if (job.applicationId) setSelectedAppId(job.applicationId);
    }
  }

  function selectDoc(doc: TailoredDocumentDto) {
    setActiveDoc(doc);
    setDraftContent(doc.content);
    setNotice(null);
    setError(null);
  }

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setGenerating(true);
    try {
      const created = await api.post<TailoredDocumentDto>("/tailor", {
        type: docType,
        tone: docType === "cover_letter" ? tone : undefined,
        jobId: selectedJobId || undefined,
        applicationId: selectedAppId || undefined,
        company: company.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
      });
      setDocs((prev) => [created, ...prev]);
      setActiveDoc(created);
      setDraftContent(created.content);
      setNotice(
        created.type === "resume"
          ? "Tailored resume generated from your verified profile."
          : "Cover letter drafted from your verified profile."
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to generate draft.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveEdits() {
    if (!activeDoc || !draftContent) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await api.patch<TailoredDocumentDto>(
        `/tailor/${activeDoc.id}`,
        { content: draftContent }
      );
      setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setActiveDoc(updated);
      setDraftContent(updated.content);
      setNotice("Saved changes.");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(docId: string) {
    setError(null);
    try {
      await api.delete(`/tailor/${docId}`);
      const remaining = docs.filter((d) => d.id !== docId);
      setDocs(remaining);
      if (activeDoc?.id === docId) {
        const next = remaining[0] ?? null;
        setActiveDoc(next);
        setDraftContent(next?.content ?? null);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to delete document.");
    }
  }

  async function handleCopy() {
    if (!activeDoc || !draftContent) return;
    const mergedDoc = { ...activeDoc, content: draftContent };
    const text =
      activeDoc.type === "resume"
        ? formatResumeAsText(mergedDoc)
        : formatCoverLetterAsText(mergedDoc);
    await navigator.clipboard.writeText(text);
    setNotice("Copied to clipboard.");
  }

  return (
    <div className="flex flex-col gap-6">
      {!embedded && (
        <div>
          <h1 className="text-2xl font-semibold text-ui-ink">AI Tailoring Studio</h1>
          <p className="mt-1 text-sm text-ui-muted">
            Tailor your verified profile and draft cover letters for specific roles — strictly grounded without fabricated experience or skills.
          </p>
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-5">
          <Card>
            <h2 className="mb-4 text-base font-semibold text-ui-ink">
              {mode === "cover_letter"
                ? "New cover letter"
                : mode === "resume"
                  ? "New tailored resume"
                  : "New tailored draft"}
            </h2>
            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
              {mode === "all" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDocType("resume")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                      docType === "resume"
                        ? "border-ui-violet bg-ui-lilac-soft text-ui-violet"
                        : "border-ui-border bg-white text-ui-body hover:bg-ui-canvas"
                    }`}
                  >
                    Tailored Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocType("cover_letter")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                      docType === "cover_letter"
                        ? "border-ui-violet bg-ui-lilac-soft text-ui-violet"
                        : "border-ui-border bg-white text-ui-body hover:bg-ui-canvas"
                    }`}
                  >
                    Cover Letter
                  </button>
                </div>
              )}

              {docType === "cover_letter" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ui-ink">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as CoverLetterTone)}
                    className="w-full rounded-lg border border-ui-border bg-white px-3 py-2 text-sm text-ui-ink focus:border-ui-violet focus:outline-none"
                  >
                    <option value="conversational">Conversational</option>
                    <option value="formal">Formal</option>
                    <option value="concise">Concise</option>
                  </select>
                </div>
              )}

              {jobs.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ui-ink">
                    Pick from discovered jobs (optional)
                  </label>
                  <select
                    value={selectedJobId}
                    onChange={(e) => handleSelectSavedJob(e.target.value)}
                    className="w-full rounded-lg border border-ui-border bg-white px-3 py-2 text-sm text-ui-ink focus:border-ui-violet focus:outline-none"
                  >
                    <option value="">Custom job / manual entry</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.company} — {job.title} ({job.match.score}% match)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {applications.length > 0 && !selectedJobId && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ui-ink">
                    Or link tracked application (optional)
                  </label>
                  <select
                    value={selectedAppId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedAppId(id);
                      const app = applications.find((a) => a.id === id);
                      if (app) {
                        setCompany(app.company);
                        setJobTitle(app.title);
                      }
                    }}
                    className="w-full rounded-lg border border-ui-border bg-white px-3 py-2 text-sm text-ui-ink focus:border-ui-violet focus:outline-none"
                  >
                    <option value="">None</option>
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.company} — {app.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <TextField
                label="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Stripe"
                required
              />
              <TextField
                label="Job title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                required
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ui-ink">
                  Job description
                </label>
                <textarea
                  rows={5}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the role description or requirements..."
                  className="w-full rounded-lg border border-ui-border p-2.5 text-sm text-ui-ink focus:border-ui-violet focus:outline-none"
                />
              </div>

              <Button type="submit" loading={generating}>
                {docType === "resume" ? "Generate tailored resume" : "Draft cover letter"}
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-semibold text-ui-ink">
              {mode === "cover_letter"
                ? "Saved cover letters"
                : mode === "resume"
                  ? "Saved tailored resumes"
                  : "Saved drafts"}
            </h2>
            {loading ? (
              <div className="h-24 animate-pulse rounded bg-ui-linen" />
            ) : docs.length === 0 ? (
              <p className="text-sm text-ui-muted">
                No {mode === "cover_letter" ? "cover letters" : mode === "resume" ? "tailored resumes" : "tailored documents"} yet. Generate your first draft above.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {docs.map((doc) => {
                  const selected = activeDoc?.id === doc.id;
                  return (
                    <li
                      key={doc.id}
                      className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm ${
                        selected ? "border-ui-violet bg-ui-lilac-soft" : "border-ui-border bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => selectDoc(doc)}
                        className="flex min-w-0 flex-1 flex-col text-left"
                      >
                        <span className="truncate font-medium text-ui-ink">
                          {doc.jobTitle}
                        </span>
                        <span className="truncate text-xs text-ui-muted">
                          {doc.company} •{" "}
                          {doc.type === "resume"
                            ? "Tailored resume"
                            : `Cover letter (${doc.tone ?? "conversational"})`}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        className="shrink-0 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="lg:col-span-7">
          {!activeDoc || !draftContent ? (
            <Card>
              <p className="py-12 text-center text-sm text-ui-muted">
                Select a saved draft or generate a{" "}
                {mode === "cover_letter"
                  ? "cover letter"
                  : mode === "resume"
                    ? "tailored resume"
                    : "tailored resume or cover letter"}{" "}
                to review and edit it here.
              </p>
            </Card>
          ) : activeDoc.type === "resume" ? (
            <ResumeDraftEditor
              doc={activeDoc}
              content={draftContent as TailoredResumeContent}
              onChange={(next) => setDraftContent(next)}
              onSave={handleSaveEdits}
              onCopy={handleCopy}
              onDownload={() =>
                downloadTextFile(
                  `${activeDoc.company}-${activeDoc.jobTitle}-resume.txt`,
                  formatResumeAsText({ ...activeDoc, content: draftContent })
                )
              }
              saving={saving}
            />
          ) : (
            <CoverLetterEditor
              doc={activeDoc}
              content={draftContent as CoverLetterContent}
              onChange={(next) => setDraftContent(next)}
              onSave={handleSaveEdits}
              onCopy={handleCopy}
              onDownload={() =>
                downloadTextFile(
                  `${activeDoc.company}-${activeDoc.jobTitle}-cover-letter.txt`,
                  formatCoverLetterAsText({
                    ...activeDoc,
                    content: draftContent,
                  })
                )
              }
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ResumeDraftEditor({
  doc,
  content,
  onChange,
  onSave,
  onCopy,
  onDownload,
  saving,
}: {
  doc: TailoredDocumentDto;
  content: TailoredResumeContent;
  onChange: (next: TailoredResumeContent) => void;
  onSave: () => void;
  onCopy: () => void;
  onDownload: () => void;
  saving: boolean;
}) {
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ui-violet">
            Tailored Resume
          </p>
          <h2 className="text-lg font-semibold text-ui-ink">
            {doc.jobTitle} at {doc.company}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={onCopy}>
            Copy Markdown
          </Button>
          <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={onDownload}>
            Download .txt
          </Button>
          <Button className="px-3 py-1.5 text-xs" loading={saving} onClick={onSave}>
            Save edits
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {content.rationale && (
          <div className="rounded-lg bg-ui-canvas p-3 text-xs text-ui-ink">
            <span className="font-semibold">Tailoring rationale: </span>
            {content.rationale}
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          {content.keywordsUsed.length > 0 && (
            <div className="min-w-[200px] flex-1">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ui-muted">
                Matched keywords used
              </p>
              <div className="flex flex-wrap gap-1.5">
                {content.keywordsUsed.map((kw) => (
                  <Badge key={kw} className="bg-emerald-50 text-emerald-700">
                    {`✓ ${kw}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {content.missingKeywords.length > 0 && (
            <div className="min-w-[200px] flex-1">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ui-muted">
                Gaps (not in your profile)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {content.missingKeywords.map((kw) => (
                  <Badge key={kw} className="bg-amber-50 text-amber-800">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <TextField
          label="Tailored headline"
          value={content.headline}
          onChange={(e) => onChange({ ...content, headline: e.target.value })}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ui-ink">
            Tailored summary
          </label>
          <textarea
            rows={4}
            value={content.summary}
            onChange={(e) => onChange({ ...content, summary: e.target.value })}
            className="w-full rounded-lg border border-ui-border p-2.5 text-sm text-ui-ink focus:border-ui-violet focus:outline-none"
          />
        </div>

        {content.experience.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-ui-ink">
              Experience emphasis (Original vs. Tailored)
            </p>
            {content.experience.map((exp, idx) => (
              <div
                key={`${exp.company}-${exp.title}-${idx}`}
                className="rounded-lg border border-ui-border p-3"
              >
                <p className="font-medium text-ui-ink">
                  {exp.title} — {exp.company}
                </p>
                <p className="mb-3 text-xs text-ui-muted">
                  {exp.startDate ?? "—"} – {exp.endDate ?? "Present"}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ui-muted">
                      Original
                    </p>
                    <p className="whitespace-pre-line rounded bg-ui-canvas p-2.5 text-xs text-ui-body">
                      {exp.originalDescription || "No original description recorded."}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ui-violet">
                      Tailored (editable)
                    </p>
                    <textarea
                      rows={5}
                      value={exp.tailoredDescription}
                      onChange={(e) => {
                        const updated = content.experience.map((item, i) =>
                          i === idx ? { ...item, tailoredDescription: e.target.value } : item
                        );
                        onChange({ ...content, experience: updated });
                      }}
                      className="w-full rounded border border-ui-border p-2 text-xs text-ui-ink focus:border-ui-violet focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function CoverLetterEditor({
  doc,
  content,
  onChange,
  onSave,
  onCopy,
  onDownload,
  saving,
}: {
  doc: TailoredDocumentDto;
  content: CoverLetterContent;
  onChange: (next: CoverLetterContent) => void;
  onSave: () => void;
  onCopy: () => void;
  onDownload: () => void;
  saving: boolean;
}) {
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ui-violet">
            Cover Letter ({doc.tone ?? "conversational"})
          </p>
          <h2 className="text-lg font-semibold text-ui-ink">
            {doc.jobTitle} at {doc.company}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={onCopy}>
            Copy letter
          </Button>
          <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={onDownload}>
            Download .txt
          </Button>
          <Button className="px-3 py-1.5 text-xs" loading={saving} onClick={onSave}>
            Save edits
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {content.keyPointsHighlighted.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {content.keyPointsHighlighted.map((point) => (
              <Badge key={point} className="bg-ui-lilac-soft text-ui-violet">
                {point}
              </Badge>
            ))}
          </div>
        )}

        <TextField
          label="Subject line"
          value={content.subjectLine}
          onChange={(e) => onChange({ ...content, subjectLine: e.target.value })}
        />

        <TextField
          label="Greeting"
          value={content.greeting}
          onChange={(e) => onChange({ ...content, greeting: e.target.value })}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ui-ink">
            Body
          </label>
          <textarea
            rows={10}
            value={content.bodyParagraphs.join("\n\n")}
            onChange={(e) =>
              onChange({
                ...content,
                bodyParagraphs: e.target.value
                  .split(/\n{2,}/)
                  .map((p) => p.trim())
                  .filter(Boolean),
              })
            }
            className="w-full rounded-lg border border-ui-border p-3 text-sm leading-relaxed text-ui-ink focus:border-ui-violet focus:outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Closing"
            value={content.closing}
            onChange={(e) => onChange({ ...content, closing: e.target.value })}
          />
          <TextField
            label="Signature"
            value={content.signature}
            onChange={(e) => onChange({ ...content, signature: e.target.value })}
          />
        </div>
      </div>
    </Card>
  );
}

