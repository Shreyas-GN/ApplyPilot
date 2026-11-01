import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResumesPage from "./page";

const getMock = vi.fn();
const uploadMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/resumes",
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "alice@example.com", emailVerified: true, createdAt: "" },
    loading: false,
    logout: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
  }),
}));

vi.mock("@/lib/api-client", () => ({
  api: {
    get: (...args: unknown[]) => getMock(...args),
    upload: (...args: unknown[]) => uploadMock(...args),
    patch: vi.fn(),
    delete: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      public detail: string,
    ) {
      super(detail);
    }
  },
}));

function makeFile(name: string, content: string, type: string): File {
  return new File([content], name, { type });
}

// userEvent.upload() models real browser behavior, where the `accept`
// attribute (here ".pdf,.docx") filters what the native file picker will
// even let you select — so it won't fire a change event for a .txt file at
// all. That's correct for simulating the picker, but this test exists
// specifically to prove the component's own defense-in-depth validation
// (handleFileSelected) rejects a disallowed file regardless of how it got
// there — e.g. drag-and-drop, which isn't constrained by `accept`. Setting
// `files` directly and dispatching the change event bypasses the picker
// simulation to exercise that code path.
function selectFileBypassingAccept(input: HTMLInputElement, file: File): void {
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  fireEvent.change(input);
}

describe("ResumesPage upload", () => {
  beforeEach(() => {
    getMock.mockReset();
    uploadMock.mockReset();
    getMock.mockResolvedValue([]); // empty resume list on initial load
  });

  it("rejects a disallowed file extension client-side without calling the upload API", async () => {
    render(<ResumesPage />);
    await screen.findByText(/no resumes yet/i);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    selectFileBypassingAccept(input, makeFile("resume.txt", "not a resume", "text/plain"));

    expect(await screen.findByText(/only \.pdf and \.docx/i)).toBeInTheDocument();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("uploads a valid PDF via the resumes/upload endpoint", async () => {
    uploadMock.mockResolvedValueOnce({
      id: "r1",
      versionLabel: "resume.pdf",
      originalFilename: "resume.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 100,
      isPrimary: true,
      processingStatus: "uploaded",
      processingError: null,
      parsingJobStatus: "queued",
      reviewStatus: null,
      createdAt: new Date().toISOString(),
    });
    render(<ResumesPage />);
    await screen.findByText(/no resumes yet/i);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const user = userEvent.setup();
    await user.upload(input, makeFile("resume.pdf", "%PDF-1.4 fake pdf content", "application/pdf"));

    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(1));
    const call = uploadMock.mock.calls[0];
    if (!call) throw new Error("uploadMock was not called");
    const [path, formData] = call;
    expect(path).toBe("/resumes/upload");
    expect(formData).toBeInstanceOf(FormData);
    expect((formData as FormData).get("file")).toBeInstanceOf(File);
  });
});
