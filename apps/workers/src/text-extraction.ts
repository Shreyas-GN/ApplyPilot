import mammoth from "mammoth";

export class UnsupportedOrCorruptFileError extends Error {}

// Deterministic (non-AI) extraction per docs/FEATURES.md "AI Tailoring" and
// the Phase 1 resume-parsing workflow in docs/PRODUCT_REQUIREMENTS.md:
// step 4 ("Text is extracted using deterministic PDF/DOCX parsers") is
// intentionally separate from, and runs before, the AI structuring step.
export async function extractResumeText(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    if (mimeType === "application/pdf") {
      return await extractPdfText(buffer);
    }
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
  } catch (error) {
    throw new UnsupportedOrCorruptFileError(
      `Could not extract text — the file may be corrupted, password-protected, or scanned ` +
        `images without embedded text. (${(error as Error).message})`,
    );
  }
  throw new UnsupportedOrCorruptFileError(`Unsupported mime type: ${mimeType}`);
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
