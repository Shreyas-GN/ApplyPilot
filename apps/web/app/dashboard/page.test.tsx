import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import DashboardPage from "./page";
import type {
  ApplicationDto,
  AuditLogDto,
  JobDto,
  ProfileDto,
  ResumeDto,
} from "@/lib/types";

const getMock = vi.fn();

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "u-1", email: "priya@example.com", emailVerified: true, createdAt: "2026-11-01T00:00:00Z" },
    loading: false,
    logout: vi.fn(),
  }),
}));

vi.mock("@/components/layout/protected-route", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="app-shell">{children}</div>,
}));

vi.mock("@/lib/api-client", () => ({
  api: {
    get: (...args: unknown[]) => getMock(...args),
  },
}));

const sampleProfile: ProfileDto = {
  fullName: "Priya Nair",
  email: "priya@example.com",
  phone: null,
  location: "Bengaluru",
  linkedinUrl: null,
  githubUrl: null,
  portfolioUrl: null,
  headline: "Senior Full-Stack Engineer",
  summary: "Ships TypeScript and Postgres systems.",
  yearsOfExperience: 6,
  employmentStatus: "actively_looking",
  preferredTitles: ["Staff Frontend Engineer"],
  preferredLocations: ["Remote"],
  workMode: "remote",
  employmentTypes: ["full_time"],
  expectedSalaryMin: null,
  expectedSalaryMax: null,
  preferredIndustries: ["Developer Tools"],
  excludedCompanies: [],
  adjacentRoles: ["Design Engineer"],
  completionPercent: 80,
  intelligence: {
    confirmedPercent: 80,
    totalWithAiPercent: 90,
    unverifiedAiCount: 1,
    confirmedItemCount: 5,
    sections: [
      {
        id: "personal_info",
        label: "Personal Info",
        complete: true,
        confirmedCount: 1,
        aiUnverifiedCount: 0,
        provenance: "user",
        weight: 15,
        earnedWeight: 15,
      },
      {
        id: "projects",
        label: "Projects",
        complete: false,
        confirmedCount: 0,
        aiUnverifiedCount: 1,
        provenance: "ai",
        weight: 10,
        earnedWeight: 0,
      },
    ],
    suggestions: [],
    aiSuggestedRoles: [
      {
        role: "Product Engineer",
        kind: "adjacent",
        reason: "Matches your confirmed frontend & TypeScript stack",
        source: "ai_suggested",
      },
    ],
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  updatedAt: "2026-11-11T10:00:00Z",
};

const sampleResumes: ResumeDto[] = [
  {
    id: "res-1",
    versionLabel: "Priya_Frontend_v3",
    originalFilename: "priya.pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 120000,
    isPrimary: true,
    processingStatus: "confirmed",
    processingError: null,
    parsingJobStatus: "completed",
    reviewStatus: "confirmed",
    createdAt: "2026-11-10T10:00:00Z",
  },
];

const sampleJobs: JobDto[] = [
  {
    id: "job-1",
    source: "greenhouse",
    externalId: "1",
    company: "Vercel",
    title: "Staff Frontend Engineer",
    location: "Remote",
    workMode: "remote",
    employmentType: "full_time",
    url: "https://example.com/job-1",
    description: "TypeScript and Next.js platform role.",
    skills: ["TypeScript", "React", "Next.js"],
    postedAt: "2026-11-11T08:00:00Z",
    createdAt: "2026-11-11T08:00:00Z",
    match: {
      score: 91,
      skillsScore: 95,
      experienceScore: 90,
      matchedSkills: ["TypeScript", "React"],
      missingSkills: [],
      transferableSkills: [],
      strengths: ["Direct stack overlap in TypeScript, React"],
      gaps: [],
      reasons: ["Matches 2 of your skills (TypeScript, React)", "Remote aligns cleanly"],
      isAdjacentRole: false,
      adjacencyReason: null,
    },
    normalizedLocation: null,
    locationCountry: null,
    isIndiaRemote: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryPeriod: null,
    salaryText: null,
    experienceLevel: null,
    experienceText: null,
    userState: "saved",
    applicationId: null,
    applicationStatus: null,
  },
  {
    id: "job-2",
    source: "greenhouse",
    externalId: "2",
    company: "Linear",
    title: "Design Engineer",
    location: "Remote",
    workMode: "remote",
    employmentType: "full_time",
    url: "https://example.com/job-2",
    description: "Design systems engineering.",
    skills: ["TypeScript", "React", "CSS"],
    postedAt: "2026-11-11T07:00:00Z",
    createdAt: "2026-11-11T07:00:00Z",
    match: {
      score: 76,
      skillsScore: 80,
      experienceScore: 72,
      matchedSkills: ["TypeScript", "React"],
      missingSkills: ["CSS"],
      transferableSkills: [],
      strengths: ["Strong frontend systems depth"],
      gaps: [],
      reasons: ["Strong transferable frontend overlap"],
      isAdjacentRole: true,
      adjacencyReason: "Different title track, but TypeScript and React transfer strongly.",
    },
    normalizedLocation: null,
    locationCountry: null,
    isIndiaRemote: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryPeriod: null,
    salaryText: null,
    experienceLevel: null,
    experienceText: null,
    userState: null,
    applicationId: null,
    applicationStatus: null,
  },
];

const sampleApps: ApplicationDto[] = [
  {
    id: "app-1",
    jobId: "job-1",
    company: "Vercel",
    title: "Staff Frontend Engineer",
    location: "Remote",
    url: null,
    status: "saved",
    matchScore: 91,
    notes: null,
    followUpAt: "2026-11-14T10:00:00Z",
    checklist: {},
    appliedAt: null,
    createdAt: "2026-11-09T10:00:00Z",
    updatedAt: "2026-11-11T09:00:00Z",
  },
  {
    id: "app-2",
    jobId: null,
    company: "Stripe",
    title: "Frontend Platform Engineer",
    location: "Remote",
    url: null,
    status: "interviewing",
    matchScore: 84,
    notes: null,
    followUpAt: null,
    checklist: {},
    appliedAt: "2026-11-05T10:00:00Z",
    createdAt: "2026-11-05T10:00:00Z",
    updatedAt: "2026-11-10T10:00:00Z",
  },
  {
    id: "app-3",
    jobId: null,
    company: "Figma",
    title: "UI Engineer",
    location: "San Francisco",
    url: null,
    status: "rejected",
    matchScore: 70,
    notes: null,
    followUpAt: null,
    checklist: {},
    appliedAt: "2026-11-01T10:00:00Z",
    createdAt: "2026-11-01T10:00:00Z",
    updatedAt: "2026-11-08T10:00:00Z",
  },
];

const sampleLogs: AuditLogDto[] = [
  {
    id: "log-1",
    action: "profile_updated",
    metadata: { section: "skills" },
    createdAt: "2026-11-11T11:00:00Z",
  },
];

describe("DashboardPage (Job Search Command Center)", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("renders all 7 command-center sections backed by real API data", async () => {
    getMock.mockImplementation((path: string) => {
      if (path === "/profile") return Promise.resolve(sampleProfile);
      if (path === "/resumes") return Promise.resolve(sampleResumes);
      if (path === "/applications") return Promise.resolve(sampleApps);
      if (path === "/jobs?tab=for_you") return Promise.resolve(sampleJobs);
      if (path === "/account/activity") return Promise.resolve(sampleLogs);
      return Promise.resolve([]);
    });

    render(<DashboardPage />);

    expect(
      await screen.findByRole("heading", { name: /welcome back, priya/i })
    ).toBeInTheDocument();

    // 2. Opportunity Snapshot
    expect(screen.getByRole("heading", { name: /best matching opportunities/i })).toBeInTheDocument();
    expect(screen.getByText("91% fit")).toBeInTheDocument();
    expect(screen.getByText(/matches 2 of your skills/i)).toBeInTheDocument();

    // 3. Explore Adjacent Roles
    expect(screen.getByRole("heading", { name: /explore adjacent roles/i })).toBeInTheDocument();
    expect(screen.getAllByText(/design engineer/i, { selector: "a" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/different title track/i)).toBeInTheDocument();

    // 4. Next Actions
    expect(screen.getByRole("heading", { name: /next actions/i })).toBeInTheDocument();
    expect(screen.getByText(/confirm 1 ai-extracted profile entry/i)).toBeInTheDocument();

    // 5. Application Progress (all 5 statuses)
    const progressHeading = screen.getByRole("heading", { name: /application progress/i });
    const progressSection = progressHeading.closest("section")!;
    expect(within(progressSection).getByText("Saved")).toBeInTheDocument();
    expect(within(progressSection).getByText("Applied")).toBeInTheDocument();
    expect(within(progressSection).getByText("Interviewing")).toBeInTheDocument();
    expect(within(progressSection).getByText("Offered")).toBeInTheDocument();
    expect(within(progressSection).getByText("Rejected")).toBeInTheDocument();

    // 6. Profile Readiness
    expect(screen.getByRole("heading", { name: /profile readiness/i })).toBeInTheDocument();
    expect(screen.getByText("Priya_Frontend_v3")).toBeInTheDocument();
    expect(screen.getByText(/projects \(verify ai\)/i)).toBeInTheDocument();

    // 7. Recent Activity
    expect(screen.getByRole("heading", { name: /recent activity/i })).toBeInTheDocument();
    expect(screen.getByText(/updated skills & technologies/i)).toBeInTheDocument();
  });

  it("renders honest empty and error states without inventing mock numbers", async () => {
    getMock.mockImplementation((path: string) => {
      if (path === "/profile") {
        return Promise.resolve({
          ...sampleProfile,
          fullName: null,
          preferredTitles: [],
          adjacentRoles: [],
          completionPercent: 0,
          intelligence: {
            confirmedPercent: 0,
            totalWithAiPercent: 0,
            unverifiedAiCount: 0,
            confirmedItemCount: 0,
            sections: [],
            suggestions: [],
            aiSuggestedRoles: [],
          },
        });
      }
      if (path === "/jobs?tab=for_you") return Promise.reject(new Error("Jobs service unavailable"));
      return Promise.resolve([]);
    });

    render(<DashboardPage />);

    expect(
      await screen.findByText(/couldn't load job matches/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/no applications tracked yet/i)).toBeInTheDocument();
      expect(screen.getByText(/no resume uploaded yet/i)).toBeInTheDocument();
      expect(screen.getByText(/no recent activity yet/i)).toBeInTheDocument();
    });
  });
});

