// Shared between apps/api (enforces these at the upload endpoint) and
// apps/web (gives the user feedback before they even submit the form).

export const RESUME_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const RESUME_ALLOWED_EXTENSIONS = [".pdf", ".docx"] as const;

export const RESUME_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function hasAllowedResumeExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return RESUME_ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
