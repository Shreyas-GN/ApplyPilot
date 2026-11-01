import { describe, expect, it } from "vitest";
import { mimeTypeMatchesSniffedType, sniffFileType } from "./file-signature.util";

describe("sniffFileType", () => {
  it("recognizes a PDF by its magic bytes", () => {
    expect(sniffFileType(Buffer.from("%PDF-1.4\n..."))).toBe("pdf");
  });

  it("recognizes a DOCX (zip container) by its magic bytes", () => {
    expect(sniffFileType(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0]))).toBe("docx");
  });

  it("returns unknown for arbitrary content, even if it has a .pdf-looking name", () => {
    expect(sniffFileType(Buffer.from("just some plain text, not a pdf"))).toBe("unknown");
  });

  it("returns unknown for an empty buffer", () => {
    expect(sniffFileType(Buffer.alloc(0))).toBe("unknown");
  });
});

describe("mimeTypeMatchesSniffedType", () => {
  it("accepts application/pdf only when content sniffs as pdf", () => {
    expect(mimeTypeMatchesSniffedType("application/pdf", "pdf")).toBe(true);
    expect(mimeTypeMatchesSniffedType("application/pdf", "docx")).toBe(false);
  });

  it("accepts the docx mime type only when content sniffs as docx", () => {
    const docxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    expect(mimeTypeMatchesSniffedType(docxMime, "docx")).toBe(true);
    expect(mimeTypeMatchesSniffedType(docxMime, "pdf")).toBe(false);
  });

  it("rejects a declared pdf mime type whose content is unrecognized (spoofed upload)", () => {
    expect(mimeTypeMatchesSniffedType("application/pdf", "unknown")).toBe(false);
  });
});
