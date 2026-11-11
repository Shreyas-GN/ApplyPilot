import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ProfileDto } from "@/lib/types";
import { replaceWorkExperienceSchema } from "@applypilot/validators";
import { PersonalInfoForm } from "./personal-info-form";
import { CareerInterestsForm } from "./career-interests-form";
import { RepeatableSection } from "./repeatable-section";

const patchMock = vi.fn();
const putMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  api: {
    patch: (...args: unknown[]) => patchMock(...args),
    put: (...args: unknown[]) => putMock(...args),
  },
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      public detail: string
    ) {
      super(detail);
    }
  },
}));

const sampleProfile: ProfileDto = {
  fullName: "Neha Rao",
  email: "neha@example.com",
  authEmail: "neha@example.com",
  phone: null,
  location: "Bengaluru",
  linkedinUrl: null,
  githubUrl: null,
  portfolioUrl: null,
  headline: "Full-Stack Engineer",
  summary: "Ships TypeScript web products.",
  careerStage: "mid_level",
  yearsOfExperience: 4,
  employmentStatus: "actively_looking",
  preferredTitles: ["Senior Frontend Engineer"],
  preferredExperienceLevel: "senior",
  preferredLocations: ["Remote"],
  workMode: "remote",
  employmentTypes: ["full_time"],
  expectedSalaryMin: null,
  expectedSalaryMax: null,
  preferredIndustries: ["Developer Tools"],
  excludedCompanies: [],
  desiredRoles: ["Staff Frontend Engineer"],
  adjacentRoles: ["Design Engineer"],
  excludedRoles: ["Support Engineer"],
  intelligenceMetadata: {
    personalInfoSource: "ai",
    summarySource: "user",
  },
  intelligence: {
    confirmedPercent: 75,
    totalWithAiPercent: 90,
    unverifiedAiCount: 1,
    confirmedItemCount: 3,
    sections: [],
    suggestions: [],
    aiSuggestedRoles: [
      {
        role: "Product Engineer",
        kind: "adjacent",
        reason: "Adjacent path leveraging your confirmed frontend stack",
        source: "ai_suggested",
      },
    ],
  },
  completionPercent: 75,
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  updatedAt: "2026-11-11T00:00:00.000Z",
};

describe("Candidate Intelligence Profile Sections", () => {
  beforeEach(() => {
    patchMock.mockReset();
    putMock.mockReset();
  });

  it("displays AI-extracted provenance on PersonalInfoForm and confirms via PATCH /profile", async () => {
    patchMock.mockResolvedValueOnce({
      ...sampleProfile,
      intelligenceMetadata: { personalInfoSource: "user", summarySource: "user" },
    });
    const onUpdated = vi.fn();
    const user = userEvent.setup();

    render(<PersonalInfoForm profile={sampleProfile} onUpdated={onUpdated} />);

    expect(screen.getByText(/ai-extracted/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /confirm ai details/i }));

    await waitFor(() =>
      expect(patchMock).toHaveBeenCalledWith(
        "/profile",
        expect.objectContaining({
          fullName: "Neha Rao",
          confirmSection: "personal_info",
        })
      )
    );
    expect(onUpdated).toHaveBeenCalledTimes(1);
  });

  it("allows saving CareerInterestsForm and accepting an unverified AI role suggestion", async () => {
    putMock.mockResolvedValue({
      ...sampleProfile,
      adjacentRoles: ["Design Engineer", "Product Engineer"],
    });
    const onUpdated = vi.fn();
    const user = userEvent.setup();

    render(<CareerInterestsForm profile={sampleProfile} onUpdated={onUpdated} />);

    expect(screen.getByText(/product engineer/i)).toBeInTheDocument();
    expect(screen.getByText(/ai-suggested/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /\+ adjacent/i }));

    await waitFor(() =>
      expect(putMock).toHaveBeenCalledWith(
        "/profile/preferences",
        expect.objectContaining({
          adjacentRoles: ["Design Engineer", "Product Engineer"],
        })
      )
    );
  });

  it("validates repeatable entries cleanly with blank dates and preserves untouched AI provenance", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <RepeatableSection
        id="section-experience"
        sectionNumber="04"
        eyebrow="Career History"
        title="Work Experience"
        fields={[
          { name: "company", label: "Company", type: "text" },
          { name: "title", label: "Role", type: "text" },
          { name: "startDate", label: "Start date", type: "text" },
          { name: "endDate", label: "End date", type: "text" },
        ]}
        initialItems={[
          {
            values: { company: "Acme", title: "Engineer", startDate: "", endDate: "" },
            source: "ai",
            confidence: 0.85,
          },
        ]}
        emptyLabel="None"
        onSave={async (entries) => {
          const parsed = replaceWorkExperienceSchema.parse({
            items: entries.map(({ values, source, confidence }) => ({
              company: String(values.company ?? ""),
              title: String(values.title ?? ""),
              startDate: String(values.startDate ?? "") || undefined,
              endDate: String(values.endDate ?? "") || undefined,
              source,
              confidence,
            })),
          });
          await onSave(parsed.items);
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: /save section/i }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith([
        expect.objectContaining({
          company: "Acme",
          title: "Engineer",
          source: "ai",
          confidence: 0.85,
        }),
      ])
    );
  });
});

