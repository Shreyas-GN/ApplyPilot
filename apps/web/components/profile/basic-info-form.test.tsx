import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ProfileDto } from "@applypilot/shared";
import { BasicInfoForm } from "./basic-info-form";

const patchMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  api: { patch: (...args: unknown[]) => patchMock(...args) },
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      public detail: string,
    ) {
      super(detail);
    }
  },
}));

const emptyProfile: ProfileDto = {
  fullName: null,
  phone: null,
  location: null,
  linkedinUrl: null,
  githubUrl: null,
  portfolioUrl: null,
  headline: null,
  summary: null,
  yearsOfExperience: null,
  employmentStatus: null,
  preferredTitles: [],
  preferredLocations: [],
  workMode: null,
  employmentTypes: [],
  expectedSalaryMin: null,
  expectedSalaryMax: null,
  preferredIndustries: [],
  excludedCompanies: [],
  completionPercent: 0,
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  updatedAt: new Date().toISOString(),
};

describe("BasicInfoForm", () => {
  beforeEach(() => {
    patchMock.mockClear();
  });

  it("pre-fills from the given profile", () => {
    render(<BasicInfoForm profile={{ ...emptyProfile, fullName: "Alice Anderson", headline: "Engineer" }} />);
    expect(screen.getByLabelText(/full name/i)).toHaveValue("Alice Anderson");
    expect(screen.getByLabelText(/headline/i)).toHaveValue("Engineer");
  });

  it("saves edited fields via PATCH /profile and shows a success message", async () => {
    patchMock.mockResolvedValueOnce({ ...emptyProfile, fullName: "Bob Builder" });
    const user = userEvent.setup();
    render(<BasicInfoForm profile={emptyProfile} />);

    await user.type(screen.getByLabelText(/full name/i), "Bob Builder");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(patchMock).toHaveBeenCalledWith("/profile", expect.objectContaining({ fullName: "Bob Builder" })),
    );
    expect(await screen.findByText(/saved/i)).toBeInTheDocument();
  });

  it("shows a validation error for an invalid LinkedIn URL and never calls the API", async () => {
    const user = userEvent.setup();
    render(<BasicInfoForm profile={emptyProfile} />);

    await user.type(screen.getByLabelText(/linkedin url/i), "not-a-url");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText(/valid url/i)).toBeInTheDocument();
    expect(patchMock).not.toHaveBeenCalled();
  });
});
