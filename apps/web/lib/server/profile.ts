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
  ProfileIntelligenceMetadataDto,
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
import {
  computeProfileIntelligence,
  parseIntelligenceMetadata,
} from './profile-intelligence';

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

export async function getProfile(
  userId: string,
  authEmail?: string | null
): Promise<ProfileDto> {
  const profile = await loadProfile(userId);
  return toProfileDto(profile, authEmail);
}

export async function updateBasicInfo(
  userId: string,
  input: UpdateProfileInput,
  authEmail?: string | null
): Promise<ProfileDto> {
  await db.insert(profiles).values({ id: userId }).onConflictDoNothing();
  const [existing] = await db
    .select({ intelligenceMetadata: profiles.intelligenceMetadata })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  const meta: ProfileIntelligenceMetadataDto = parseIntelligenceMetadata(
    existing?.intelligenceMetadata
  );

  const updateData: Partial<typeof profiles.$inferInsert> = {
    updatedAt: new Date(),
  };

  let touchedPersonal = false;
  let touchedSummary = false;

  if (input.fullName !== undefined) {
    updateData.fullName = input.fullName || null;
    touchedPersonal = true;
  }
  if (input.contactEmail !== undefined) {
    updateData.contactEmail = input.contactEmail || null;
    touchedPersonal = true;
  }
  if (input.phone !== undefined) {
    updateData.phone = input.phone || null;
    touchedPersonal = true;
  }
  if (input.location !== undefined) {
    updateData.location = input.location || null;
    touchedPersonal = true;
  }
  if (input.linkedinUrl !== undefined) {
    updateData.linkedinUrl = input.linkedinUrl || null;
    touchedPersonal = true;
  }
  if (input.githubUrl !== undefined) {
    updateData.githubUrl = input.githubUrl || null;
    touchedPersonal = true;
  }
  if (input.portfolioUrl !== undefined) {
    updateData.portfolioUrl = input.portfolioUrl || null;
    touchedPersonal = true;
  }
  if (input.headline !== undefined) {
    updateData.headline = input.headline || null;
    touchedSummary = true;
  }
  if (input.summary !== undefined) {
    updateData.summary = input.summary || null;
    touchedSummary = true;
  }
  if (input.careerStage !== undefined) {
    updateData.careerStage = input.careerStage || null;
    touchedSummary = true;
  }
  if (input.yearsOfExperience !== undefined) {
    updateData.yearsOfExperience = input.yearsOfExperience;
    touchedSummary = true;
  }
  if (input.employmentStatus !== undefined) {
    updateData.employmentStatus = input.employmentStatus || null;
    touchedSummary = true;
  }

  if (touchedPersonal || input.confirmSection === 'personal_info') {
    meta.personalInfoSource = 'user';
  }
  if (touchedSummary || input.confirmSection === 'professional_summary') {
    meta.summarySource = 'user';
  }
  updateData.intelligenceMetadata = meta;

  await db.update(profiles).set(updateData).where(eq(profiles.id, userId));
  await recordAudit(userId, 'profile_updated', {
    section: input.confirmSection ?? 'basic',
  });

  return getProfile(userId, authEmail);
}

export async function updatePreferences(
  userId: string,
  input: UpdatePreferencesInput,
  authEmail?: string | null
): Promise<ProfileDto> {
  await db.insert(profiles).values({ id: userId }).onConflictDoNothing();

  const updateData: Partial<typeof profiles.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.preferredTitles !== undefined)
    updateData.preferredTitles = input.preferredTitles;
  if (input.preferredExperienceLevel !== undefined)
    updateData.preferredExperienceLevel = input.preferredExperienceLevel || null;
  if (input.preferredLocations !== undefined)
    updateData.preferredLocations = input.preferredLocations;
  if (input.workMode !== undefined) updateData.workMode = input.workMode || null;
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
  if (input.desiredRoles !== undefined)
    updateData.desiredRoles = input.desiredRoles;
  if (input.adjacentRoles !== undefined)
    updateData.adjacentRoles = input.adjacentRoles;
  if (input.excludedRoles !== undefined)
    updateData.excludedRoles = input.excludedRoles;
  if (input.notificationPreferences !== undefined)
    updateData.notificationPreferences = input.notificationPreferences;

  if (input.dismissSuggestedRole) {
    const [existing] = await db
      .select({ intelligenceMetadata: profiles.intelligenceMetadata })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
    const meta = parseIntelligenceMetadata(existing?.intelligenceMetadata);
    const currentDismissed = new Set(meta.dismissedRoleSuggestions ?? []);
    currentDismissed.add(input.dismissSuggestedRole);
    meta.dismissedRoleSuggestions = Array.from(currentDismissed);
    updateData.intelligenceMetadata = meta;
  }

  await db.update(profiles).set(updateData).where(eq(profiles.id, userId));
  await recordAudit(userId, 'profile_updated', { section: 'preferences' });

  return getProfile(userId, authEmail);
}

export async function replaceExperience(
  userId: string,
  input: ReplaceWorkExperienceInput,
  authEmail?: string | null
): Promise<ProfileDto> {
  await db.transaction(async (tx) => {
    await tx
      .delete(workExperiences)
      .where(eq(workExperiences.userId, userId));

    if (input.items.length > 0) {
      await tx.insert(workExperiences).values(
        input.items.map((item) => {
          const responsibilities = cleanList(item.responsibilities);
          const achievements = cleanList(item.achievements);
          const technologies = cleanList(item.technologies);
          const fallbackDesc = [...responsibilities, ...achievements].join('\n');
          const description =
            item.description?.trim() || (fallbackDesc ? fallbackDesc : null);

          return {
            userId,
            company: item.company,
            title: item.title,
            location: item.location || null,
            startDate: parseLooseDate(item.startDate),
            endDate: item.isCurrent ? null : parseLooseDate(item.endDate),
            isCurrent: item.isCurrent ?? false,
            description,
            responsibilities,
            achievements,
            technologies,
            source: item.source === 'ai' ? ('ai' as const) : ('user' as const),
            confidence:
              item.confidence !== undefined && item.confidence !== null
                ? String(item.confidence)
                : null,
          };
        })
      );
    }
  });

  await recordAudit(userId, 'profile_updated', { section: 'experience' });
  return getProfile(userId, authEmail);
}

export async function replaceEducation(
  userId: string,
  input: ReplaceEducationInput,
  authEmail?: string | null
): Promise<ProfileDto> {
  await db.transaction(async (tx) => {
    await tx
      .delete(educationEntries)
      .where(eq(educationEntries.userId, userId));

    if (input.items.length > 0) {
      await tx.insert(educationEntries).values(
        input.items.map((item) => {
          const endDate = parseLooseDate(item.endDate);
          const graduationYear =
            item.graduationYear !== undefined
              ? item.graduationYear
              : endDate
                ? endDate.getUTCFullYear()
                : null;
          return {
            userId,
            institution: item.institution,
            degree: item.degree || null,
            fieldOfStudy: item.fieldOfStudy || null,
            startDate: parseLooseDate(item.startDate),
            endDate,
            graduationYear,
            grade: item.grade || null,
            description: item.description || null,
            source: item.source === 'ai' ? ('ai' as const) : ('user' as const),
            confidence:
              item.confidence !== undefined && item.confidence !== null
                ? String(item.confidence)
                : null,
          };
        })
      );
    }
  });

  await recordAudit(userId, 'profile_updated', { section: 'education' });
  return getProfile(userId, authEmail);
}

export async function replaceSkills(
  userId: string,
  input: ReplaceSkillsInput,
  authEmail?: string | null
): Promise<ProfileDto> {
  const seen = new Map<string, ReplaceSkillsInput['items'][number]>();
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
          category: item.category || null,
          proficiency: item.proficiency || null,
          yearsOfExperience:
            item.yearsOfExperience !== undefined &&
            item.yearsOfExperience !== null
              ? String(item.yearsOfExperience)
              : null,
          evidence: item.evidence || null,
          source: item.source === 'ai' ? ('ai' as const) : ('user' as const),
          confidence:
            item.confidence !== undefined && item.confidence !== null
              ? String(item.confidence)
              : null,
        }))
      );
    }
  });

  await recordAudit(userId, 'profile_updated', { section: 'skills' });
  return getProfile(userId, authEmail);
}

export async function replaceProjects(
  userId: string,
  input: ReplaceProjectsInput,
  authEmail?: string | null
): Promise<ProfileDto> {
  await db.transaction(async (tx) => {
    await tx.delete(projects).where(eq(projects.userId, userId));

    if (input.items.length > 0) {
      await tx.insert(projects).values(
        input.items.map((item) => {
          const liveUrl = item.liveUrl || null;
          const githubUrl = item.githubUrl || null;
          const primaryUrl = liveUrl || githubUrl || item.url || null;
          return {
            userId,
            name: item.name,
            description: item.description || null,
            role: item.role || null,
            technologies: cleanList(item.technologies),
            contributions: cleanList(item.contributions),
            url: primaryUrl,
            githubUrl,
            liveUrl,
            startDate: parseLooseDate(item.startDate),
            endDate: parseLooseDate(item.endDate),
            source: item.source === 'ai' ? ('ai' as const) : ('user' as const),
            confidence:
              item.confidence !== undefined && item.confidence !== null
                ? String(item.confidence)
                : null,
          };
        })
      );
    }
  });

  await recordAudit(userId, 'profile_updated', { section: 'projects' });
  return getProfile(userId, authEmail);
}

export async function replaceCertifications(
  userId: string,
  input: ReplaceCertificationsInput,
  authEmail?: string | null
): Promise<ProfileDto> {
  await db.transaction(async (tx) => {
    await tx.delete(certifications).where(eq(certifications.userId, userId));

    if (input.items.length > 0) {
      await tx.insert(certifications).values(
        input.items.map((item) => ({
          userId,
          name: item.name,
          issuer: item.issuer || null,
          issueDate: parseLooseDate(item.issueDate),
          expiryDate: parseLooseDate(item.expiryDate),
          credentialUrl: item.credentialUrl || null,
          source: item.source === 'ai' ? ('ai' as const) : ('user' as const),
          confidence:
            item.confidence !== undefined && item.confidence !== null
              ? String(item.confidence)
              : null,
        }))
      );
    }
  });

  await recordAudit(userId, 'profile_updated', {
    section: 'certifications',
  });
  return getProfile(userId, authEmail);
}

export async function applyParsedResumeData(
  userId: string,
  parsed: ResumeParsedData
): Promise<void> {
  await db.insert(profiles).values({ id: userId }).onConflictDoNothing();
  const [existing] = await db
    .select({ intelligenceMetadata: profiles.intelligenceMetadata })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  const meta = parseIntelligenceMetadata(existing?.intelligenceMetadata);

  const personalUpdates: Partial<typeof profiles.$inferInsert> = {};
  const p = parsed.personal;
  let updatedPersonalFromAi = false;
  let updatedSummaryFromAi = false;

  if (p.fullName) {
    personalUpdates.fullName = p.fullName;
    updatedPersonalFromAi = true;
  }
  if (p.email) {
    personalUpdates.contactEmail = p.email;
    updatedPersonalFromAi = true;
  }
  if (p.phone) {
    personalUpdates.phone = p.phone;
    updatedPersonalFromAi = true;
  }
  if (p.location) {
    personalUpdates.location = p.location;
    updatedPersonalFromAi = true;
  }
  if (p.linkedinUrl) {
    personalUpdates.linkedinUrl = p.linkedinUrl;
    updatedPersonalFromAi = true;
  }
  if (p.githubUrl) {
    personalUpdates.githubUrl = p.githubUrl;
    updatedPersonalFromAi = true;
  }
  if (p.portfolioUrl) {
    personalUpdates.portfolioUrl = p.portfolioUrl;
    updatedPersonalFromAi = true;
  }
  if (p.headline) {
    personalUpdates.headline = p.headline;
    updatedSummaryFromAi = true;
  }
  if (p.summary) {
    personalUpdates.summary = p.summary;
    updatedSummaryFromAi = true;
  }

  if (updatedPersonalFromAi && meta.personalInfoSource !== 'user') {
    meta.personalInfoSource = 'ai';
  }
  if (updatedSummaryFromAi && meta.summarySource !== 'user') {
    meta.summarySource = 'ai';
  }
  personalUpdates.intelligenceMetadata = meta;

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
  let [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile) {
    await db.insert(profiles).values({ id: userId }).onConflictDoNothing();
    [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
  }

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

function cleanList(items: string[] | undefined): string[] {
  if (!items) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
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

function toProfileDto(
  profile: ProfileWithRelations,
  authEmail?: string | null
): ProfileDto {
  const intelligenceMetadata = parseIntelligenceMetadata(
    profile.intelligenceMetadata
  );

  const baseProfile: Omit<ProfileDto, 'intelligence' | 'completionPercent'> = {
    fullName: profile.fullName,
    email: profile.contactEmail || authEmail || null,
    authEmail: authEmail ?? null,
    phone: profile.phone,
    location: profile.location,
    linkedinUrl: profile.linkedinUrl,
    githubUrl: profile.githubUrl,
    portfolioUrl: profile.portfolioUrl,
    headline: profile.headline,
    summary: profile.summary,
    careerStage: profile.careerStage,
    yearsOfExperience: profile.yearsOfExperience,
    employmentStatus: profile.employmentStatus,
    preferredTitles: profile.preferredTitles,
    preferredExperienceLevel: profile.preferredExperienceLevel,
    preferredLocations: profile.preferredLocations,
    workMode: profile.workMode,
    employmentTypes: profile.employmentTypes,
    expectedSalaryMin: profile.expectedSalaryMin,
    expectedSalaryMax: profile.expectedSalaryMax,
    preferredIndustries: profile.preferredIndustries,
    excludedCompanies: profile.excludedCompanies,
    desiredRoles: profile.desiredRoles,
    adjacentRoles: profile.adjacentRoles,
    excludedRoles: profile.excludedRoles,
    intelligenceMetadata,
    notificationPreferences: {
      followUpReminders: true,
      jobMatchAlerts: true,
      weeklyDigest: false,
      productUpdates: false,
      ...(typeof profile.notificationPreferences === 'object' &&
      profile.notificationPreferences !== null
        ? (profile.notificationPreferences as Record<string, boolean>)
        : {}),
    },
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
        responsibilities: item.responsibilities ?? [],
        achievements: item.achievements ?? [],
        technologies: item.technologies ?? [],
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
        graduationYear:
          item.graduationYear ??
          (item.endDate ? item.endDate.getUTCFullYear() : null),
        grade: item.grade,
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
        proficiency: item.proficiency,
        yearsOfExperience: toConfidence(item.yearsOfExperience),
        evidence: item.evidence,
        source: item.source as 'user' | 'ai',
        confidence: toConfidence(item.confidence),
      })
    ),
    projects: profile.projects.map(
      (item): ProjectDto => ({
        id: item.id,
        name: item.name,
        description: item.description,
        role: item.role,
        technologies: item.technologies ?? [],
        contributions: item.contributions ?? [],
        url: item.url,
        githubUrl: item.githubUrl,
        liveUrl: item.liveUrl,
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

  const intelligence = computeProfileIntelligence(baseProfile);

  return {
    ...baseProfile,
    completionPercent: intelligence.confirmedPercent,
    intelligence,
  };
}

