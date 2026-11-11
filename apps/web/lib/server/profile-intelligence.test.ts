import { describe, expect, it } from "vitest";
import type { ProfileDto } from "@/lib/types";
import { computeProfileIntelligence } from "./profile-intelligence";

function baseProfile(
  overrides: Partial<Omit<ProfileDto, "intelligence" | "completionPercent">> = {}
): Omit<ProfileDto, "intelligence" | "completionPercent"> {
  return {
    fullName: null,
    email: null,
    authEmail: null,
    phone: null,
    location: null,
    linkedinUrl: null,
    githubUrl: null,
    portfolioUrl: null,
    headline: null,
    summary: null,
    careerStage: null,
    yearsOfExperience: null,
    employmentStatus: null,
    preferredTitles: [],
    preferredExperienceLevel: null,
    preferredLocations: [],
    workMode: null,
    employmentTypes: [],
    expectedSalaryMin: null,
    expectedSalaryMax: null,
    preferredIndustries: [],
    excludedCompanies: [],
    desiredRoles: [],
    adjacentRoles: [],
    excludedRoles: [],
    intelligenceMetadata: {},
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    updatedAt: "2026-11-11T00:00:00.000Z",
    ...overrides,
  };
}

describe("computeProfileIntelligence", () => {
  it("returns 0% and no hardcoded role suggestions on a brand new empty profile", () => {
    const intel = computeProfileIntelligence(baseProfile());

    expect(intel.confirmedPercent).toBe(0);
    expect(intel.totalWithAiPercent).toBe(0);
    expect(intel.unverifiedAiCount).toBe(0);
    expect(intel.sections).toHaveLength(9);
    expect(intel.aiSuggestedRoles).toEqual([]);
    expect(intel.suggestions.length).toBeGreaterThan(0);
  });

  it("never counts unverified AI-extracted items or AI-prefilled sections as confirmed", () => {
    const intel = computeProfileIntelligence(
      baseProfile({
        fullName: "Jordan Lee",
        email: "jordan@example.com",
        linkedinUrl: "https://linkedin.com/in/jordan",
        headline: "Staff Backend Engineer",
        summary: "Distributed systems architect",
        intelligenceMetadata: {
          personalInfoSource: "ai",
          summarySource: "ai",
        },
        skills: [
          { id: "1", name: "Go", category: "Languages", source: "ai", confidence: 0.9 },
          { id: "2", name: "PostgreSQL", category: "DB", source: "ai", confidence: 0.85 },
          { id: "3", name: "Docker", category: "Infra", source: "ai", confidence: 0.8 },
        ],
        experience: [
          {
            id: "exp-1",
            company: "Acme",
            title: "Backend Engineer",
            location: null,
            startDate: "2022-01-01",
            endDate: null,
            isCurrent: true,
            description: "Built Go services",
            source: "ai",
            confidence: 0.92,
          },
        ],
      })
    );

    expect(intel.confirmedPercent).toBe(0);
    expect(intel.totalWithAiPercent).toBe(55);
    expect(intel.unverifiedAiCount).toBe(6);
    expect(intel.suggestions[0]?.kind).toBe("verify_ai");
    expect(intel.aiSuggestedRoles).toEqual([]);
  });

  it("reaches 100% across all 9 confirmed sections and suggests relevant unexplored roles", () => {
    const intel = computeProfileIntelligence(
      baseProfile({
        fullName: "Jordan Lee",
        email: "jordan@example.com",
        linkedinUrl: "https://linkedin.com/in/jordan",
        headline: "Frontend Architect",
        summary: "Building accessible TypeScript and React design systems.",
        intelligenceMetadata: {
          personalInfoSource: "user",
          summarySource: "user",
          dismissedRoleSuggestions: ["Design Engineer"],
        },
        skills: [
          { id: "1", name: "TypeScript", category: "Languages", proficiency: "expert", evidence: "5 yrs", source: "user", confidence: null },
          { id: "2", name: "React", category: "Frontend", proficiency: "expert", evidence: "Design sys", source: "user", confidence: null },
          { id: "3", name: "Next.js", category: "Frontend", proficiency: "proficient", source: "user", confidence: null },
        ],
        experience: [
          {
            id: "exp-1",
            company: "Acme",
            title: "Senior Frontend Engineer",
            location: "Remote",
            startDate: "2021-01-01",
            endDate: null,
            isCurrent: true,
            description: "Led frontend architecture",
            achievements: ["Cut bundle size by 40%"],
            source: "user",
            confidence: null,
          },
        ],
        education: [
          {
            id: "edu-1",
            institution: "State University",
            degree: "BSc",
            fieldOfStudy: "Computer Science",
            startDate: null,
            endDate: null,
            graduationYear: 2019,
            description: null,
            source: "user",
            confidence: null,
          },
        ],
        projects: [
          {
            id: "proj-1",
            name: "FieldGuide UI",
            description: "Accessible component kit",
            url: "https://github.com/jordan/fieldguide",
            startDate: null,
            endDate: null,
            source: "user",
            confidence: null,
          },
        ],
        certifications: [
          {
            id: "cert-1",
            name: "AWS Certified Developer",
            issuer: "AWS",
            issueDate: "2024-01-01",
            expiryDate: null,
            credentialUrl: null,
            source: "user",
            confidence: null,
          },
        ],
        preferredTitles: ["Staff Frontend Engineer"],
        workMode: "remote",
        desiredRoles: ["Staff Frontend Engineer"],
        adjacentRoles: ["Developer Experience Engineer"],
        excludedRoles: ["Product Engineer"],
        preferredIndustries: ["Developer Tools"],
      })
    );

    expect(intel.confirmedPercent).toBe(100);
    expect(intel.unverifiedAiCount).toBe(0);
    expect(intel.suggestions).toEqual([]);
    const suggestedNames = intel.aiSuggestedRoles.map((r) => r.role);
    expect(suggestedNames).not.toContain("Design Engineer");
    expect(suggestedNames).not.toContain("Product Engineer");
    expect(suggestedNames).toContain("Frontend Engineer");
  });
});

