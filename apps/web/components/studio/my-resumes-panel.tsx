"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ResumeDto } from "@/lib/types";
import { hasAllowedResumeExtension, RESUME_MAX_FILE_SIZE_BYTES } from "@applypilot/validators";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";

const PROCESSING_STATUSES = new Set(["uploaded", "extracting", "extracted", "parsing"]);

export function MyResumesPanel({ embedded = false }: { embedded?: boolean }) {
  const { data: resumes, loading, error, refetch } = useApi<ResumeDto[]>("/resumes");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stillProcessing = resumes?.some((r) => PROCESSING_STATUSES.has(r.processingStatus));

  useEffect(() => {
    if (!stillProcessing) return;
    const interval = setInterval(refetch, 2000);
    return () => clearInterval(interval);
  }, [stillProcessing, refetch]);

  async function handleFileSelected(file: File) {
    setUploadError(null);
    if (!hasAllowedResumeExtension(file.name)) {
      setUploadError("Only .pdf and .docx files are supported.");
      return;
    }
    if (file.size > RESUME_MAX_FILE_SIZE_BYTES) {
      setUploadError(`File is too large (max ${RESUME_MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB).`);
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      await api.upload("/resumes/upload", formData);
      refetch();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.detail : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSetPrimary(id: string) {
    await api.patch(`/resumes/${id}/primary`);
    refetch();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this resume? This can't be undone.")) return;
    await api.delete(`/resumes/${id}`);
    refetch();
  }

  async function handleDownload(id: string) {
    const { url } = await api.get<{ url: string }>(`/resumes/${id}/download-url`);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const uploadControl = (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFileSelected(file);
        }}
      />
      <Button onClick={() => fileInputRef.current?.click()} loading={uploading}>
        Upload resume
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {!embedded && (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Resumes</h1>
          {uploadControl}
        </div>
      )}

      {uploadError && <Alert tone="error">{uploadError}</Alert>}

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <CardHeader
            title="Your resumes"
            description="Upload a PDF or DOCX. We'll extract the text and suggest a structured profile for you to review."
          />
          {embedded && uploadControl}
        </div>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">Couldn&apos;t load your resumes.</p>
        ) : !resumes || resumes.length === 0 ? (
          <p className="text-sm text-slate-400">
            No resumes yet. Upload one to get started — we&apos;ll do the rest.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {resumes.map((resume) => (
              <li key={resume.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-slate-900">{resume.versionLabel}</p>
                    {resume.isPrimary && (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Uploaded {new Date(resume.createdAt).toLocaleDateString()} ·{" "}
                    {(resume.fileSizeBytes / 1024).toFixed(0)} KB
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status={resume.processingStatus} />
                    {resume.processingStatus === "parsed" && resume.reviewStatus !== "confirmed" && (
                      <StatusBadge status="pending_review" />
                    )}
                    {resume.reviewStatus === "confirmed" && <StatusBadge status="confirmed" />}
                  </div>
                  {resume.processingError && (
                    <p className="mt-1 text-xs text-red-600">{resume.processingError}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {resume.processingStatus === "parsed" && (
                    <Link href={`/resumes/${resume.id}/review`}>
                      <Button variant="secondary">Review</Button>
                    </Link>
                  )}
                  <Button variant="ghost" onClick={() => handleDownload(resume.id)}>
                    Download
                  </Button>
                  {!resume.isPrimary && (
                    <Button variant="ghost" onClick={() => handleSetPrimary(resume.id)}>
                      Set primary
                    </Button>
                  )}
                  <Button variant="danger" onClick={() => handleDelete(resume.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

