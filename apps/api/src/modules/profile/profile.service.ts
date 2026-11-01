import { Injectable } from "@nestjs/common";
import type {
  Certification,
  Education,
  Profile,
  Project,
  Skill,
  WorkExperience,
} from "@prisma/client";
import type {
  CertificationDto,
  EducationDto,
  ProfileDto,
  ProjectDto,
  SkillDto,
  WorkExperienceDto,
} from "@applypilot/shared";
import type {
  ReplaceCertificationsInput,
  ReplaceEducationInput,
  ReplaceProjectsInput,
  ReplaceSkillsInput,
  ReplaceWorkExperienceInput,
  ResumeParsedData,
  UpdatePreferencesInput,
  UpdateProfileInput,
} from "@applypilot/validators";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "@applypilot/shared";

type ProfileWithRelations = Profile & {
  experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
};

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getProfile(userId: string): Promise<ProfileDto> {
    const profile = await this.loadProfile(userId);
    return toProfileDto(profile);
  }

  async updateBasicInfo(userId: string, input: UpdateProfileInput): Promise<ProfileDto> {
    await this.prisma.profile.update({
      where: { userId },
      data: {
        ...(input.fullName !== undefined && { fullName: input.fullName }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.location !== undefined && { location: input.location }),
        ...(input.linkedinUrl !== undefined && { linkedinUrl: input.linkedinUrl || null }),
        ...(input.githubUrl !== undefined && { githubUrl: input.githubUrl || null }),
        ...(input.portfolioUrl !== undefined && { portfolioUrl: input.portfolioUrl || null }),
        ...(input.headline !== undefined && { headline: input.headline }),
        ...(input.summary !== undefined && { summary: input.summary }),
        ...(input.yearsOfExperience !== undefined && {
          yearsOfExperience: input.yearsOfExperience,
        }),
        ...(input.employmentStatus !== undefined && {
          employmentStatus: input.employmentStatus,
        }),
      },
    });
    await this.auditService.record(userId, AuditAction.PROFILE_UPDATED, { section: "basic" });
    return this.getProfile(userId);
  }

  async updatePreferences(userId: string, input: UpdatePreferencesInput): Promise<ProfileDto> {
    await this.prisma.profile.update({
      where: { userId },
      data: {
        ...(input.preferredTitles !== undefined && { preferredTitles: input.preferredTitles }),
        ...(input.preferredLocations !== undefined && {
          preferredLocations: input.preferredLocations,
        }),
        ...(input.workMode !== undefined && { workMode: input.workMode }),
        ...(input.employmentTypes !== undefined && { employmentTypes: input.employmentTypes }),
        ...(input.expectedSalaryMin !== undefined && {
          expectedSalaryMin: input.expectedSalaryMin,
        }),
        ...(input.expectedSalaryMax !== undefined && {
          expectedSalaryMax: input.expectedSalaryMax,
        }),
        ...(input.preferredIndustries !== undefined && {
          preferredIndustries: input.preferredIndustries,
        }),
        ...(input.excludedCompanies !== undefined && {
          excludedCompanies: input.excludedCompanies,
        }),
      },
    });
    await this.auditService.record(userId, AuditAction.PROFILE_UPDATED, {
      section: "preferences",
    });
    return this.getProfile(userId);
  }

  async replaceExperience(userId: string, input: ReplaceWorkExperienceInput): Promise<ProfileDto> {
    await this.prisma.$transaction([
      this.prisma.workExperience.deleteMany({ where: { userId } }),
      this.prisma.workExperience.createMany({
        data: input.items.map((item) => ({
          userId,
          company: item.company,
          title: item.title,
          location: item.location,
          startDate: parseLooseDate(item.startDate),
          endDate: parseLooseDate(item.endDate),
          isCurrent: item.isCurrent ?? false,
          description: item.description,
          source: "user",
        })),
      }),
    ]);
    await this.auditService.record(userId, AuditAction.PROFILE_UPDATED, { section: "experience" });
    return this.getProfile(userId);
  }

  async replaceEducation(userId: string, input: ReplaceEducationInput): Promise<ProfileDto> {
    await this.prisma.$transaction([
      this.prisma.education.deleteMany({ where: { userId } }),
      this.prisma.education.createMany({
        data: input.items.map((item) => ({
          userId,
          institution: item.institution,
          degree: item.degree,
          fieldOfStudy: item.fieldOfStudy,
          startDate: parseLooseDate(item.startDate),
          endDate: parseLooseDate(item.endDate),
          description: item.description,
          source: "user",
        })),
      }),
    ]);
    await this.auditService.record(userId, AuditAction.PROFILE_UPDATED, { section: "education" });
    return this.getProfile(userId);
  }

  async replaceSkills(userId: string, input: ReplaceSkillsInput): Promise<ProfileDto> {
    // Dedupe case-insensitively — "React" and "react" from different sources
    // (manual entry vs. resume parsing) shouldn't become two rows.
    const seen = new Map<string, { name: string; category?: string }>();
    for (const item of input.items) {
      seen.set(item.name.toLowerCase(), item);
    }

    await this.prisma.$transaction([
      this.prisma.skill.deleteMany({ where: { userId } }),
      this.prisma.skill.createMany({
        data: [...seen.values()].map((item) => ({
          userId,
          name: item.name,
          category: item.category,
          source: "user",
        })),
      }),
    ]);
    await this.auditService.record(userId, AuditAction.PROFILE_UPDATED, { section: "skills" });
    return this.getProfile(userId);
  }

  async replaceProjects(userId: string, input: ReplaceProjectsInput): Promise<ProfileDto> {
    await this.prisma.$transaction([
      this.prisma.project.deleteMany({ where: { userId } }),
      this.prisma.project.createMany({
        data: input.items.map((item) => ({
          userId,
          name: item.name,
          description: item.description,
          url: item.url || null,
          startDate: parseLooseDate(item.startDate),
          endDate: parseLooseDate(item.endDate),
          source: "user",
        })),
      }),
    ]);
    await this.auditService.record(userId, AuditAction.PROFILE_UPDATED, { section: "projects" });
    return this.getProfile(userId);
  }

  async replaceCertifications(
    userId: string,
    input: ReplaceCertificationsInput,
  ): Promise<ProfileDto> {
    await this.prisma.$transaction([
      this.prisma.certification.deleteMany({ where: { userId } }),
      this.prisma.certification.createMany({
        data: input.items.map((item) => ({
          userId,
          name: item.name,
          issuer: item.issuer,
          issueDate: parseLooseDate(item.issueDate),
          expiryDate: parseLooseDate(item.expiryDate),
          credentialUrl: item.credentialUrl || null,
          source: "user",
        })),
      }),
    ]);
    await this.auditService.record(userId, AuditAction.PROFILE_UPDATED, {
      section: "certifications",
    });
    return this.getProfile(userId);
  }

  // Called only from the resume-confirm flow (apps/api/src/modules/resumes).
  // Unlike the manual PUT endpoints above (which always stamp source="user"
  // because a human just typed the data), this preserves each entry's own
  // source/confidence from the parsed payload — ai-sourced fields stay
  // visibly ai-sourced even after the user has reviewed and confirmed them.
  // Confirming a resume replaces the corresponding profile sections
  // entirely: the resume is treated as the authoritative current snapshot,
  // not an incremental merge, so re-confirming never accumulates
  // duplicates across uploads.
  async applyParsedResumeData(userId: string, parsed: ResumeParsedData): Promise<void> {
    const personalUpdates: Record<string, string> = {};
    const p = parsed.personal;
    if (p.fullName) personalUpdates.fullName = p.fullName;
    if (p.phone) personalUpdates.phone = p.phone;
    if (p.location) personalUpdates.location = p.location;
    if (p.linkedinUrl) personalUpdates.linkedinUrl = p.linkedinUrl;
    if (p.githubUrl) personalUpdates.githubUrl = p.githubUrl;
    if (p.portfolioUrl) personalUpdates.portfolioUrl = p.portfolioUrl;
    if (p.headline) personalUpdates.headline = p.headline;
    if (p.summary) personalUpdates.summary = p.summary;

    const seenSkills = new Map<string, { name: string; category?: string; source: string; confidence: number }>();
    for (const skill of parsed.skills) {
      seenSkills.set(skill.name.toLowerCase(), skill);
    }

    await this.prisma.$transaction([
      ...(Object.keys(personalUpdates).length > 0
        ? [this.prisma.profile.update({ where: { userId }, data: personalUpdates })]
        : []),
      this.prisma.workExperience.deleteMany({ where: { userId } }),
      this.prisma.workExperience.createMany({
        data: parsed.experience.map((item) => ({
          userId,
          company: item.company,
          title: item.title,
          location: item.location,
          startDate: parseLooseDate(item.startDate),
          endDate: parseLooseDate(item.endDate),
          isCurrent: item.isCurrent ?? false,
          description: item.description,
          source: item.source,
          confidence: item.confidence,
        })),
      }),
      this.prisma.education.deleteMany({ where: { userId } }),
      this.prisma.education.createMany({
        data: parsed.education.map((item) => ({
          userId,
          institution: item.institution,
          degree: item.degree,
          fieldOfStudy: item.fieldOfStudy,
          startDate: parseLooseDate(item.startDate),
          endDate: parseLooseDate(item.endDate),
          description: item.description,
          source: item.source,
          confidence: item.confidence,
        })),
      }),
      this.prisma.skill.deleteMany({ where: { userId } }),
      this.prisma.skill.createMany({
        data: [...seenSkills.values()].map((item) => ({
          userId,
          name: item.name,
          category: item.category,
          source: item.source,
          confidence: item.confidence,
        })),
      }),
      this.prisma.project.deleteMany({ where: { userId } }),
      this.prisma.project.createMany({
        data: parsed.projects.map((item) => ({
          userId,
          name: item.name,
          description: item.description,
          url: item.url,
          startDate: parseLooseDate(item.startDate),
          endDate: parseLooseDate(item.endDate),
          source: item.source,
          confidence: item.confidence,
        })),
      }),
      this.prisma.certification.deleteMany({ where: { userId } }),
      this.prisma.certification.createMany({
        data: parsed.certifications.map((item) => ({
          userId,
          name: item.name,
          issuer: item.issuer,
          issueDate: parseLooseDate(item.issueDate),
          expiryDate: parseLooseDate(item.expiryDate),
          credentialUrl: item.credentialUrl,
          source: item.source,
          confidence: item.confidence,
        })),
      }),
    ]);

    await this.auditService.record(userId, AuditAction.PROFILE_UPDATED, {
      section: "resume_confirm",
    });
  }

  private async loadProfile(userId: string): Promise<ProfileWithRelations> {
    const profile = await this.prisma.profile.findUniqueOrThrow({ where: { userId } });
    const [experience, education, skills, projects, certifications] = await Promise.all([
      this.prisma.workExperience.findMany({ where: { userId }, orderBy: { startDate: "desc" } }),
      this.prisma.education.findMany({ where: { userId }, orderBy: { startDate: "desc" } }),
      this.prisma.skill.findMany({ where: { userId }, orderBy: { name: "asc" } }),
      this.prisma.project.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      this.prisma.certification.findMany({ where: { userId }, orderBy: { issueDate: "desc" } }),
    ]);
    return { ...profile, experience, education, skills, projects, certifications };
  }
}

function parseLooseDate(value: string | undefined): Date | null {
  if (!value) return null;
  // "2021" / "2021-05" / "2021-05-14" all parse fine via Date's ISO handling
  // once padded to at least a full month.
  const padded = value.length === 4 ? `${value}-01` : value;
  const date = new Date(padded);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoOrNull(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

function toConfidence(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function computeCompletionPercent(profile: ProfileWithRelations): number {
  let score = 0;
  if (profile.fullName && profile.headline && profile.summary) score += 20;
  if (profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl) score += 10;
  if (profile.experience.length > 0) score += 20;
  if (profile.education.length > 0) score += 15;
  if (profile.skills.length >= 3) score += 15;
  if (profile.projects.length > 0) score += 10;
  if (profile.preferredTitles.length > 0 || profile.workMode) score += 10;
  return Math.min(score, 100);
}

function toProfileDto(profile: ProfileWithRelations): ProfileDto {
  return {
    fullName: profile.fullName,
    phone: profile.phone,
    location: profile.location,
    linkedinUrl: profile.linkedinUrl,
    githubUrl: profile.githubUrl,
    portfolioUrl: profile.portfolioUrl,
    headline: profile.headline,
    summary: profile.summary,
    yearsOfExperience: profile.yearsOfExperience,
    employmentStatus: profile.employmentStatus,
    preferredTitles: profile.preferredTitles,
    preferredLocations: profile.preferredLocations,
    workMode: profile.workMode,
    employmentTypes: profile.employmentTypes,
    expectedSalaryMin: profile.expectedSalaryMin,
    expectedSalaryMax: profile.expectedSalaryMax,
    preferredIndustries: profile.preferredIndustries,
    excludedCompanies: profile.excludedCompanies,
    completionPercent: computeCompletionPercent(profile),
    experience: profile.experience.map(
      (item): WorkExperienceDto => ({
        id: item.id,
        company: item.company,
        title: item.title,
        location: item.location,
        startDate: toIsoOrNull(item.startDate),
        endDate: toIsoOrNull(item.endDate),
        isCurrent: item.isCurrent,
        description: item.description,
        source: item.source as "user" | "ai",
        confidence: toConfidence(item.confidence),
      }),
    ),
    education: profile.education.map(
      (item): EducationDto => ({
        id: item.id,
        institution: item.institution,
        degree: item.degree,
        fieldOfStudy: item.fieldOfStudy,
        startDate: toIsoOrNull(item.startDate),
        endDate: toIsoOrNull(item.endDate),
        description: item.description,
        source: item.source as "user" | "ai",
        confidence: toConfidence(item.confidence),
      }),
    ),
    skills: profile.skills.map(
      (item): SkillDto => ({
        id: item.id,
        name: item.name,
        category: item.category,
        source: item.source as "user" | "ai",
        confidence: toConfidence(item.confidence),
      }),
    ),
    projects: profile.projects.map(
      (item): ProjectDto => ({
        id: item.id,
        name: item.name,
        description: item.description,
        url: item.url,
        startDate: toIsoOrNull(item.startDate),
        endDate: toIsoOrNull(item.endDate),
        source: item.source as "user" | "ai",
        confidence: toConfidence(item.confidence),
      }),
    ),
    certifications: profile.certifications.map(
      (item): CertificationDto => ({
        id: item.id,
        name: item.name,
        issuer: item.issuer,
        issueDate: toIsoOrNull(item.issueDate),
        expiryDate: toIsoOrNull(item.expiryDate),
        credentialUrl: item.credentialUrl,
        source: item.source as "user" | "ai",
        confidence: toConfidence(item.confidence),
      }),
    ),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
