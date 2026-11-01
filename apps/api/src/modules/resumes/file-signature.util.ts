// Declared Content-Type headers are trivial to spoof, so we also sniff the
// first few bytes of the actual file content before trusting it — defense
// in depth against a mislabeled or malicious upload.

const PDF_MAGIC = Buffer.from("%PDF");
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // DOCX is a zip container

export type SniffedFileType = "pdf" | "docx" | "unknown";

export function sniffFileType(buffer: Buffer): SniffedFileType {
  if (buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
    return "pdf";
  }
  if (buffer.subarray(0, ZIP_MAGIC.length).equals(ZIP_MAGIC)) {
    return "docx";
  }
  return "unknown";
}

export function mimeTypeMatchesSniffedType(mimeType: string, sniffed: SniffedFileType): boolean {
  if (sniffed === "pdf") return mimeType === "application/pdf";
  if (sniffed === "docx") {
    return mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return false;
}
