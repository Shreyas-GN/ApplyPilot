import { desc, asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  profiles,
  workExperiences,
  educationEntries,
  skills,
  projects,
  certifications,
} from '@/lib/db/schema';
import type {
  CertificationDto,
  EducationDto,
  ProfileDto,
  ProjectDto,
  SkillDto,
  WorkExperienceDto,
} from '@/lib/types';
import type {
  ReplaceCertificationsInput,
  ReplaceEducationInput,
  ReplaceProjectsInput,
  ReplaceSkillsInput,
  ReplaceWorkExperienceInput,
  ResumeParsedData,
  UpdatePreferencesInput,
  UpdateProfileInput,
} from '@applypilot/validators';
import { recordAudit } from './audit';

type WorkExperienceRow = typeof workExperiences.$inferSelect;
type EducationRow = typeof educationEntries.$inferSelect;
type SkillRow = typeof skills.$inferSelect;
type ProjectRow = typeof projects.$inferSelect;
type CertificationRow = typeof certifications.$inferSelect;
type ProfileRow = typeof profiles.$inferSelect;

interface ProfileWithRelations extends ProfileRow {
  experience: WorkExperienceRow[];
  education: EducationRow[];
  skills: SkillRow[];
  projects: ProjectRow[];
  certifications: CertificationRow[];
}

export async function getProfile(userId: string): Promise<ProfileDto> {
  const profile = await loadProfile(userId);
  return toProfileDto(profile);
}

export async function updateBasicInfo(
  userId: string,
  input: UpdateProfileInput
): Promise<ProfileDto> {
  await db.insert(profiles).values({ id: userId }).onConflictDoNothing();

  const updateData: Partial<typeof profiles.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.fullName !== undefined) updateData.fullName = input.fullName;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.location !== undefined) updateData.location = input.location;
  if (input.linkedinUrl !== undefined)
    updateData.linkedinUrl = input.linkedinUrl || null;
  if (input.githubUrl !== undefined)
    updateData.githubUrl = input.githubUrl || null;
  if (input.portfolioUrl !== undefined)
    updateData.portfolioUrl = input.portfolioUrl || null;
  if (input.headline !== undefined) updateData.headline = input.headline;
  if (input.summary !== undefined) updateData.summary = input.summary;
  if (input.yearsOfExperience !== undefined)
    updateData.yearsOfExperience = input.yearsOfExperience;
  if (input.employmentStatus !== undefined)
    updateData.employmentStatus = input.employmentStatus;

  await db.update(profiles).set(updateData).where(eq(profiles.id, userId));
  await recordAudit(userId, 'profile_updated', { section: 'basic' });

  return getProfile(userId);
}

export async function updatePreferences(
  userId: string,
  input: UpdatePreferencesInput
): Promise<ProfileDto> {
  await db.insert(profiles).values({ id: userId }).onConflictDoNothing();

  const updateData: Partial<typeof profiles.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.preferredTitles !== undefined)
    updateData.preferredTitles = input.preferredTitles;
  if (input.preferredLocations !== undefined)
    updateData.preferredLocations = input.preferredLocations;
  if (input.workMode !== undefined) updateData.workMode = input.workMode;
  if (input.employmentTypes !== undefined)
    updateData.employmentTypes = input.employmentTypes;
  if (input.expectedSalaryMin !== undefined)
    updateData.expectedSalaryMin = input.expectedSalaryMin;
  if (input.expectedSalaryMax !== undefined)
    updateData.expectedSalaryMax = input.expectedSalaryMax;
  if (input.preferredIndustries !== undefined)
    updateData.preferredIndustries = input.preferredIndustries;
  if (input.excludedCompanies !== undefined)
    updateData.excludedCompanies = input.excludedCompanies;

  await db.update(profiles).set(updateData).where(eq(profiles.id, userId));
  await recordAudit(userId, 'profile_updated', { section: 'preferences' });

  return getProfile(userId);
}

export async function replaceExperience(
  userId: string,
  input: ReplaceWorkExperienceInput
): Promise<ProfileDto> {
  await db.transaction(async (tx) => {
    await tx
      .delete(workExperiences)
      .where(eq(workExperiences.userId, userId));

    if (input.items.length > 0) {
      await tx.insert(workExperiences).values(
        input.items.map((item) => ({
          userId,
          company: item.company,
          title: item.title,
          location: item.location ?? null,
          startDate: parseLooseDate(item.startDate),
          endDate: parseLooseDate(item.endDate),
          isCurrent: item.isCurrent ?? false,
          description: item.description ?? null,
          source: 'user' as const,
        }))
      );
    }
  });

  await recordAudit(userId, 'profile_updated', { section: 'experience' });
  return getProfile(userId);
}

export async function replaceEducation(
  userId: string,
  input: ReplaceEducationInput
): Promise<ProfileDto> {
  await db.transaction(async (tx) => {
    await tx
      .delete(educationEntries)
      .where(eq(educationEntries.userId, userId));

    if (input.items.length > 0) {
      await tx.insert(educationEntries).values(
        input.items.map((item) => ({
          userId,
          institution: item.institution,
          degree: item.degree ?? null,
          fieldOfStudy: item.fieldOfStudy ?? null,
          startDate: parseLooseDate(item.startDate),
          endDate: parseLooseDate(item.endDate),
          description: item.description ?? null,
          source: 'user' as const,
        }))
      );
    }
  });

  await recordAudit(userId, 'profile_updated', { section: 'education' });
  return getProfile(userId);
}

export async function replaceSkills(
  userId: string,
  input: ReplaceSkillsInput
): Promise<ProfileDto> {
  const seen = new Map<string, { name: string; category?: string }>();
  for (const item of input.items) {
    seen.set(item.name.toLowerCase(), item);
  }

  await db.transaction(async (tx) => {
    await tx.delete(skills).where(eq(skills.userId, userId));

    const deduplicated = Array.from(seen.values());
    if (deduplicated.length > 0) {
      await tx.insert(skills).values(
        deduplicated.map((item) => ({
          userId,
          name: item.name,
          category: item.category ?? null,
          source: 'user' as const,
        }))
      );
    }
  });

  await recordAudit(userId, 'profile_updated', { section: 'skills' });
  return getProfile(userId);
}

export async function replaceProjects(
  userId: string,
  input: ReplaceProjectsInput
): Promise<ProfileDto> {
  await db.transaction(async (tx) => {
    await tx.delete(projects).where(eq(projects.userId, userId));

    if (input.items.length > 0) {
      await tx.insert(projects).values(
        input.items.map((item) => ({
          userId,
          name: item.name,
          description: item.description ?? null,
          url: item.url || null,
          startDate: parseLooseDate(item.startDate),
          endDate: parseLooseDate(item.endDate),
          source: 'user' as const,
        }))
      );
    }
  });

  await recordAudit(userId, 'profile_updated', { section: 'projects' });
  return getProfile(userId);
}

export async function replaceCertifications(
  userId: string,
  input: ReplaceCertificationsInput
): Promise<ProfileDto> {
  await db.transaction(async (tx) => {
    await tx.delete(certifications).where(eq(certifications.userId, userId));

    if (input.items.length > 0) {
      await tx.insert(certifications).values(
        input.items.map((item) => ({
          userId,
          name: item.name,
          issuer: item.issuer ?? null,
          issueDate: parseLooseDate(item.issueDate),
          expiryDate: parseLooseDate(item.expiryDate),
          credentialUrl: item.credentialUrl || null,
          source: 'user' as const,
        }))
      );
    }
  });

  await recordAudit(userId, 'profile_updated', {
    section: 'certifications',
  });
  return getProfile(userId);
}

export async function applyParsedResumeData(
  userId: string,
  parsed: ResumeParsedData
): Promise<void> {
  await db.insert(profiles).values({ id: userId }).onConflictDoNothing();

  const personalUpdates: Partial<typeof profiles.$inferInsert> = {};
  const p = parsed.personal;
  if (p.fullName) personalUpdates.fullName = p.fullName;
  if (p.phone) personalUpdates.phone = p.phone;
  if (p.location) personalUpdates.location = p.location;
  if (p.linkedinUrl) personalUpdates.linkedinUrl = p.linkedinUrl;
  if (p.githubUrl) personalUpdates.githubUrl = p.githubUrl;
  if (p.portfolioUrl) personalUpdates.portfolioUrl = p.portfolioUrl;
  if (p.headline) personalUpdates.headline = p.headline;
  if (p.summary) personalUpdates.summary = p.summary;

  const seenSkills = new Map<
    string,
    {
      name: string;
      category?: string;
      source: 'user' | 'ai';
      confidence: number;
    }
  >();
  for (const skill of parsed.skills) {
    seenSkills.set(skill.name.toLowerCase(), skill);
  }

  await db.transaction(async (tx) => {
    if (Object.keys(personalUpdates).length > 0) {
      await tx
        .update(profiles)
        .set({ ...personalUpdates, updatedAt: new Date() })
        .where(eq(profiles.id, userId));
    }

    await tx
      .delete(workExperiences)
      .where(eq(workExperiences.userId, userId));
    if (parsed.experience.length > 0) {
      await tx.insert(workExperiences).values(
        parsed.experience.map((item) => ({
          userId,
          company: item.company,
          title: item.title,
          location: item.location ?? null,
          startDate: parseLooseDate(item.startDate),
          endDate: parseLooseDate(item.endDate),
          isCurrent: item.isCurrent ?? false,
          description: item.description ?? null,
          source: item.source,
          confidence: String(item.confidence),
        }))
      );
    }

    await tx
      .delete(educationEntries)
      .where(eq(educationEntries.userId, userId));
    if (parsed.education.length > 0) {
      await tx.insert(educationEntries).values(
        parsed.education.map((item) => ({
          userId,
          institution: item.institution,
          degree: item.degree ?? null,
          fieldOfStudy: item.fieldOfStudy ?? null,
          startDate: parseLooseDate(item.startDate),
          endDate: parseLooseDate(item.endDate),
          description: item.description ?? null,
          source: item.source,
          confidence: String(item.confidence),
        }))
      );
    }

    await tx.delete(skills).where(eq(skills.userId, userId));
    const skillList = Array.from(seenSkills.values());
    if (skillList.length > 0) {
      await tx.insert(skills).values(
        skillList.map((item) => ({
          userId,
          name: item.name,
          category: item.category ?? null,
          source: item.source,
          confidence: String(item.confidence),
        }))
      );
    }

    await tx.delete(projects).where(eq(projects.userId, userId));
    if (parsed.projects.length > 0) {
      await tx.insert(projects).values(
        parsed.projects.map((item) => ({
          userId,
          name: item.name,
          description: item.description ?? null,
          url: item.url || null,
          startDate: parseLooseDate(item.startDate),
          endDate: parseLooseDate(item.endDate),
          source: item.source,
          confidence: String(item.confidence),
        }))
      );
    }

    await tx.delete(certifications).where(eq(certifications.userId, userId));
    if (parsed.certifications.length > 0) {
      await tx.insert(certifications).values(
        parsed.certifications.map((item) => ({
          userId,
          name: item.name,
          issuer: item.issuer ?? null,
          issueDate: parseLooseDate(item.issueDate),
          expiryDate: parseLooseDate(item.expiryDate),
          credentialUrl: item.credentialUrl || null,
          source: item.source,
          confidence: String(item.confidence),
        }))
      );
    }
  });

  await recordAudit(userId, 'profile_updated', {
    section: 'resume_confirm',
  });
}

async function loadProfile(userId: string): Promise<ProfileWithRelations> {
  await db.insert(profiles).values({ id: userId }).onConflictDoNothing();

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile) {
    throw new Error(`Profile not found for userId ${userId}`);
  }

  const [experience, education, skillRows, projectRows, certRows] =
    await Promise.all([
      db
        .select()
        .from(workExperiences)
        .where(eq(workExperiences.userId, userId))
        .orderBy(desc(workExperiences.startDate)),
      db
        .select()
        .from(educationEntries)
        .where(eq(educationEntries.userId, userId))
        .orderBy(desc(educationEntries.startDate)),
      db
        .select()
        .from(skills)
        .where(eq(skills.userId, userId))
        .orderBy(asc(skills.name)),
      db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(desc(projects.createdAt)),
      db
        .select()
        .from(certifications)
        .where(eq(certifications.userId, userId))
        .orderBy(desc(certifications.issueDate)),
    ]);

  return {
    ...profile,
    experience,
    education,
    skills: skillRows,
    projects: projectRows,
    certifications: certRows,
  };
}

function parseLooseDate(value: string | undefined | null): Date | null {
  if (!value) return null;
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
        source: item.source as 'user' | 'ai',
        confidence: toConfidence(item.confidence),
      })
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
        source: item.source as 'user' | 'ai',
        confidence: toConfidence(item.confidence),
      })
    ),
    skills: profile.skills.map(
      (item): SkillDto => ({
        id: item.id,
        name: item.name,
        category: item.category,
        source: item.source as 'user' | 'ai',
        confidence: toConfidence(item.confidence),
      })
    ),
    projects: profile.projects.map(
      (item): ProjectDto => ({
        id: item.id,
        name: item.name,
        description: item.description,
        url: item.url,
        startDate: toIsoOrNull(item.startDate),
        endDate: toIsoOrNull(item.endDate),
        source: item.source as 'user' | 'ai',
        confidence: toConfidence(item.confidence),
      })
    ),
    certifications: profile.certifications.map(
      (item): CertificationDto => ({
        id: item.id,
        name: item.name,
        issuer: item.issuer,
        issueDate: toIsoOrNull(item.issueDate),
        expiryDate: toIsoOrNull(item.expiryDate),
        credentialUrl: item.credentialUrl,
        source: item.source as 'user' | 'ai',
        confidence: toConfidence(item.confidence),
      })
    ),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

