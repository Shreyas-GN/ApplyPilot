import { prisma } from '@/lib/db/prisma'
import type {
  CertificationDto,
  EducationDto,
  ProfileDto,
  ProfileIntelligenceMetadataDto,
  ProjectDto,
  SkillDto,
  WorkExperienceDto,
} from '@/lib/types'
import type {
  ReplaceCertificationsInput,
  ReplaceEducationInput,
  ReplaceProjectsInput,
  ReplaceSkillsInput,
  ReplaceWorkExperienceInput,
  ResumeParsedData,
  UpdatePreferencesInput,
  UpdateProfileInput,
} from '@applypilot/validators'
import { Prisma } from '@prisma/client'
import { recordAudit } from './audit'
import { computeProfileIntelligence, parseIntelligenceMetadata } from './profile-intelligence'

type ProfileRow = NonNullable<Awaited<ReturnType<typeof prisma.profile.findUnique>>>
type WorkExperienceRow = Awaited<ReturnType<typeof prisma.workExperience.findMany>>[number]
type EducationEntryRow = Awaited<ReturnType<typeof prisma.educationEntry.findMany>>[number]
type SkillRow = Awaited<ReturnType<typeof prisma.skill.findMany>>[number]
type ProjectRow = Awaited<ReturnType<typeof prisma.project.findMany>>[number]
type CertificationRow = Awaited<ReturnType<typeof prisma.certification.findMany>>[number]

interface ProfileWithRelations {
  profile: ProfileRow
  workExperiences: WorkExperienceRow[]
  educationEntries: EducationEntryRow[]
  skills: SkillRow[]
  projects: ProjectRow[]
  certifications: CertificationRow[]
}

async function fetchProfileWithRelations(userId: string): Promise<ProfileWithRelations | null> {
  const [profile, workExperiences, educationEntries, skills, projects, certifications] =
    await Promise.all([
      prisma.profile.findUnique({ where: { id: userId } }),
      prisma.workExperience.findMany({ where: { userId }, orderBy: { startDate: 'desc' } }),
      prisma.educationEntry.findMany({ where: { userId }, orderBy: { startDate: 'desc' } }),
      prisma.skill.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
      prisma.project.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.certification.findMany({ where: { userId }, orderBy: { issueDate: 'desc' } }),
    ])

  if (!profile) return null
  return { profile, workExperiences, educationEntries, skills, projects, certifications }
}

export async function getProfile(
  userId: string,
  authEmail?: string | null
): Promise<ProfileDto> {
  const data = await loadProfile(userId)
  return toProfileDto(data, authEmail)
}

export async function updateBasicInfo(
  userId: string,
  input: UpdateProfileInput,
  authEmail?: string | null
): Promise<ProfileDto> {
  await prisma.profile.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  })
  const existing = await prisma.profile.findUnique({
    where: { id: userId },
    select: { intelligenceMetadata: true },
  })

  const meta: ProfileIntelligenceMetadataDto = parseIntelligenceMetadata(
    existing?.intelligenceMetadata
  )

  const updateData: Prisma.ProfileUpdateInput = { updatedAt: new Date() }

  let touchedPersonal = false
  let touchedSummary = false

  if (input.fullName !== undefined) { updateData.fullName = input.fullName || null; touchedPersonal = true }
  if (input.contactEmail !== undefined) { updateData.contactEmail = input.contactEmail || null; touchedPersonal = true }
  if (input.phone !== undefined) { updateData.phone = input.phone || null; touchedPersonal = true }
  if (input.location !== undefined) { updateData.location = input.location || null; touchedPersonal = true }
  if (input.linkedinUrl !== undefined) { updateData.linkedinUrl = input.linkedinUrl || null; touchedPersonal = true }
  if (input.githubUrl !== undefined) { updateData.githubUrl = input.githubUrl || null; touchedPersonal = true }
  if (input.portfolioUrl !== undefined) { updateData.portfolioUrl = input.portfolioUrl || null; touchedPersonal = true }
  if (input.headline !== undefined) { updateData.headline = input.headline || null; touchedSummary = true }
  if (input.summary !== undefined) { updateData.summary = input.summary || null; touchedSummary = true }
  if (input.careerStage !== undefined) { updateData.careerStage = input.careerStage || null; touchedSummary = true }
  if (input.yearsOfExperience !== undefined) { updateData.yearsOfExperience = input.yearsOfExperience; touchedSummary = true }
  if (input.employmentStatus !== undefined) { updateData.employmentStatus = input.employmentStatus || null; touchedSummary = true }

  if (touchedPersonal || input.confirmSection === 'personal_info') meta.personalInfoSource = 'user'
  if (touchedSummary || input.confirmSection === 'professional_summary') meta.summarySource = 'user'
  updateData.intelligenceMetadata = meta as unknown as Prisma.InputJsonValue

  await prisma.profile.update({ where: { id: userId }, data: updateData })
  await recordAudit(userId, 'profile_updated', { section: input.confirmSection ?? 'basic' })
  return getProfile(userId, authEmail)
}

export async function updatePreferences(
  userId: string,
  input: UpdatePreferencesInput,
  authEmail?: string | null
): Promise<ProfileDto> {
  await prisma.profile.upsert({ where: { id: userId }, create: { id: userId }, update: {} })

  const updateData: Prisma.ProfileUpdateInput = { updatedAt: new Date() }

  if (input.preferredTitles !== undefined) updateData.preferredTitles = input.preferredTitles
  if (input.preferredExperienceLevel !== undefined) updateData.preferredExperienceLevel = input.preferredExperienceLevel || null
  if (input.preferredLocations !== undefined) updateData.preferredLocations = input.preferredLocations
  if (input.workMode !== undefined) updateData.workMode = input.workMode || null
  if (input.employmentTypes !== undefined) updateData.employmentTypes = input.employmentTypes
  if (input.expectedSalaryMin !== undefined) updateData.expectedSalaryMin = input.expectedSalaryMin
  if (input.expectedSalaryMax !== undefined) updateData.expectedSalaryMax = input.expectedSalaryMax
  if (input.preferredIndustries !== undefined) updateData.preferredIndustries = input.preferredIndustries
  if (input.excludedCompanies !== undefined) updateData.excludedCompanies = input.excludedCompanies
  if (input.desiredRoles !== undefined) updateData.desiredRoles = input.desiredRoles
  if (input.adjacentRoles !== undefined) updateData.adjacentRoles = input.adjacentRoles
  if (input.excludedRoles !== undefined) updateData.excludedRoles = input.excludedRoles
  if (input.notificationPreferences !== undefined)
    updateData.notificationPreferences = input.notificationPreferences as unknown as Prisma.InputJsonValue

  if (input.dismissSuggestedRole) {
    const p = await prisma.profile.findUnique({ where: { id: userId }, select: { intelligenceMetadata: true } })
    const meta = parseIntelligenceMetadata(p?.intelligenceMetadata)
    const dismissed = new Set(meta.dismissedRoleSuggestions ?? [])
    dismissed.add(input.dismissSuggestedRole)
    meta.dismissedRoleSuggestions = Array.from(dismissed)
    updateData.intelligenceMetadata = meta as unknown as Prisma.InputJsonValue
  }

  await prisma.profile.update({ where: { id: userId }, data: updateData })
  await recordAudit(userId, 'profile_updated', { section: 'preferences' })
  return getProfile(userId, authEmail)
}

export async function replaceExperience(
  userId: string,
  input: ReplaceWorkExperienceInput,
  authEmail?: string | null
): Promise<ProfileDto> {
  await prisma.$transaction(async (tx) => {
    await tx.workExperience.deleteMany({ where: { userId } })
    if (input.items.length > 0) {
      await tx.workExperience.createMany({
        data: input.items.map((item: ReplaceWorkExperienceInput['items'][number]) => {
          const responsibilities = cleanList(item.responsibilities)
          const achievements = cleanList(item.achievements)
          const technologies = cleanList(item.technologies)
          const fallbackDesc = [...responsibilities, ...achievements].join('\n')
          return {
            userId,
            company: item.company,
            title: item.title,
            location: item.location || null,
            startDate: parseLooseDate(item.startDate),
            endDate: item.isCurrent ? null : parseLooseDate(item.endDate),
            isCurrent: item.isCurrent ?? false,
            description: item.description?.trim() || (fallbackDesc ? fallbackDesc : null),
            responsibilities,
            achievements,
            technologies,
            source: item.source === 'ai' ? ('ai' as const) : ('user' as const),
            confidence: item.confidence != null ? item.confidence : null,
          }
        }),
      })
    }
  })
  await recordAudit(userId, 'profile_updated', { section: 'experience' })
  return getProfile(userId, authEmail)
}

export async function replaceEducation(
  userId: string,
  input: ReplaceEducationInput,
  authEmail?: string | null
): Promise<ProfileDto> {
  await prisma.$transaction(async (tx) => {
    await tx.educationEntry.deleteMany({ where: { userId } })
    if (input.items.length > 0) {
      await tx.educationEntry.createMany({
        data: input.items.map((item: ReplaceEducationInput['items'][number]) => {
          const endDate = parseLooseDate(item.endDate)
          const graduationYear =
            item.graduationYear !== undefined ? item.graduationYear : endDate ? endDate.getUTCFullYear() : null
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
            confidence: item.confidence != null ? item.confidence : null,
          }
        }),
      })
    }
  })
  await recordAudit(userId, 'profile_updated', { section: 'education' })
  return getProfile(userId, authEmail)
}

export async function replaceSkills(
  userId: string,
  input: ReplaceSkillsInput,
  authEmail?: string | null
): Promise<ProfileDto> {
  const seen = new Map<string, ReplaceSkillsInput['items'][number]>()
  for (const item of input.items) seen.set(item.name.toLowerCase(), item)

  await prisma.$transaction(async (tx) => {
    await tx.skill.deleteMany({ where: { userId } })
    const deduplicated = Array.from(seen.values())
    if (deduplicated.length > 0) {
      await tx.skill.createMany({
        data: deduplicated.map((item: ReplaceSkillsInput['items'][number]) => ({
          userId,
          name: item.name,
          category: item.category || null,
          proficiency: item.proficiency || null,
          yearsOfExperience: item.yearsOfExperience != null ? item.yearsOfExperience : null,
          evidence: item.evidence || null,
          source: item.source === 'ai' ? ('ai' as const) : ('user' as const),
          confidence: item.confidence != null ? item.confidence : null,
        })),
      })
    }
  })
  await recordAudit(userId, 'profile_updated', { section: 'skills' })
  return getProfile(userId, authEmail)
}

export async function replaceProjects(
  userId: string,
  input: ReplaceProjectsInput,
  authEmail?: string | null
): Promise<ProfileDto> {
  await prisma.$transaction(async (tx) => {
    await tx.project.deleteMany({ where: { userId } })
    if (input.items.length > 0) {
      await tx.project.createMany({
        data: input.items.map((item: ReplaceProjectsInput['items'][number]) => {
          const liveUrl = item.liveUrl || null
          const githubUrl = item.githubUrl || null
          const primaryUrl = liveUrl || githubUrl || item.url || null
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
            confidence: item.confidence != null ? item.confidence : null,
          }
        }),
      })
    }
  })
  await recordAudit(userId, 'profile_updated', { section: 'projects' })
  return getProfile(userId, authEmail)
}

export async function replaceCertifications(
  userId: string,
  input: ReplaceCertificationsInput,
  authEmail?: string | null
): Promise<ProfileDto> {
  await prisma.$transaction(async (tx) => {
    await tx.certification.deleteMany({ where: { userId } })
    if (input.items.length > 0) {
      await tx.certification.createMany({
        data: input.items.map((item: ReplaceCertificationsInput['items'][number]) => ({
          userId,
          name: item.name,
          issuer: item.issuer || null,
          issueDate: parseLooseDate(item.issueDate),
          expiryDate: parseLooseDate(item.expiryDate),
          credentialUrl: item.credentialUrl || null,
          source: item.source === 'ai' ? ('ai' as const) : ('user' as const),
          confidence: item.confidence != null ? item.confidence : null,
        })),
      })
    }
  })
  await recordAudit(userId, 'profile_updated', { section: 'certifications' })
  return getProfile(userId, authEmail)
}

export async function applyParsedResumeData(userId: string, parsed: ResumeParsedData): Promise<void> {
  await prisma.profile.upsert({ where: { id: userId }, create: { id: userId }, update: {} })
  const p = await prisma.profile.findUnique({ where: { id: userId }, select: { intelligenceMetadata: true } })
  const meta = parseIntelligenceMetadata(p?.intelligenceMetadata)

  const profileUpdates: Prisma.ProfileUpdateInput = {}
  const personal = parsed.personal
  let updatedPersonalFromAi = false
  let updatedSummaryFromAi = false

  if (personal.fullName) { profileUpdates.fullName = personal.fullName; updatedPersonalFromAi = true }
  if (personal.email) { profileUpdates.contactEmail = personal.email; updatedPersonalFromAi = true }
  if (personal.phone) { profileUpdates.phone = personal.phone; updatedPersonalFromAi = true }
  if (personal.location) { profileUpdates.location = personal.location; updatedPersonalFromAi = true }
  if (personal.linkedinUrl) { profileUpdates.linkedinUrl = personal.linkedinUrl; updatedPersonalFromAi = true }
  if (personal.githubUrl) { profileUpdates.githubUrl = personal.githubUrl; updatedPersonalFromAi = true }
  if (personal.portfolioUrl) { profileUpdates.portfolioUrl = personal.portfolioUrl; updatedPersonalFromAi = true }
  if (personal.headline) { profileUpdates.headline = personal.headline; updatedSummaryFromAi = true }
  if (personal.summary) { profileUpdates.summary = personal.summary; updatedSummaryFromAi = true }

  if (updatedPersonalFromAi && meta.personalInfoSource !== 'user') meta.personalInfoSource = 'ai'
  if (updatedSummaryFromAi && meta.summarySource !== 'user') meta.summarySource = 'ai'
  profileUpdates.intelligenceMetadata = meta as unknown as Prisma.InputJsonValue

  const seenSkills = new Map<string, { name: string; category?: string; source: 'user' | 'ai'; confidence: number }>()
  for (const skill of parsed.skills) seenSkills.set(skill.name.toLowerCase(), skill)

  await prisma.$transaction(async (tx) => {
    if (Object.keys(profileUpdates).length > 0) {
      await tx.profile.update({ where: { id: userId }, data: { ...profileUpdates, updatedAt: new Date() } })
    }

    await tx.workExperience.deleteMany({ where: { userId } })
    if (parsed.experience.length > 0) {
      await tx.workExperience.createMany({
        data: parsed.experience.map((item: { company: string; title: string; location?: string | null; startDate?: string | null; endDate?: string | null; isCurrent?: boolean; description?: string | null; source: string; confidence: number }) => ({
          userId, company: item.company, title: item.title, location: item.location ?? null,
          startDate: parseLooseDate(item.startDate), endDate: parseLooseDate(item.endDate),
          isCurrent: item.isCurrent ?? false, description: item.description ?? null,
          source: item.source as 'user' | 'ai', confidence: item.confidence,
        })),
      })
    }

    await tx.educationEntry.deleteMany({ where: { userId } })
    if (parsed.education.length > 0) {
      await tx.educationEntry.createMany({
        data: (parsed.education as unknown as Array<{ institution: string; degree?: string | null; fieldOfStudy?: string | null; startDate?: string | null; endDate?: string | null; description?: string | null; source: string; confidence: number }>).map((item) => ({
          userId, institution: item.institution, degree: item.degree ?? null,
          fieldOfStudy: item.fieldOfStudy ?? null, startDate: parseLooseDate(item.startDate),
          endDate: parseLooseDate(item.endDate), description: item.description ?? null,
          source: item.source as 'user' | 'ai', confidence: item.confidence,
        })),
      })
    }

    await tx.skill.deleteMany({ where: { userId } })
    const skillList = Array.from(seenSkills.values())
    if (skillList.length > 0) {
      await tx.skill.createMany({
        data: skillList.map((item) => ({
          userId, name: item.name, category: item.category ?? null,
          source: item.source, confidence: item.confidence,
        })),
      })
    }

    await tx.project.deleteMany({ where: { userId } })
    if (parsed.projects.length > 0) {
      await tx.project.createMany({
        data: (parsed.projects as unknown as Array<{ name: string; description?: string | null; url?: string | null; startDate?: string | null; endDate?: string | null; source: string; confidence: number }>).map((item) => ({
          userId, name: item.name, description: item.description ?? null,
          url: item.url || null, startDate: parseLooseDate(item.startDate),
          endDate: parseLooseDate(item.endDate), source: item.source as 'user' | 'ai',
          confidence: item.confidence,
        })),
      })
    }

    await tx.certification.deleteMany({ where: { userId } })
    if (parsed.certifications.length > 0) {
      await tx.certification.createMany({
        data: (parsed.certifications as unknown as Array<{ name: string; issuer?: string | null; issueDate?: string | null; expiryDate?: string | null; credentialUrl?: string | null; source: string; confidence: number }>).map((item) => ({
          userId, name: item.name, issuer: item.issuer ?? null,
          issueDate: parseLooseDate(item.issueDate), expiryDate: parseLooseDate(item.expiryDate),
          credentialUrl: item.credentialUrl || null, source: item.source as 'user' | 'ai',
          confidence: item.confidence,
        })),
      })
    }
  })

  await recordAudit(userId, 'profile_updated', { section: 'resume_confirm' })
}

async function loadProfile(userId: string): Promise<ProfileWithRelations> {
  let data = await fetchProfileWithRelations(userId)

  if (!data) {
    await prisma.profile.create({ data: { id: userId } })
    data = await fetchProfileWithRelations(userId)
  }

  if (!data) throw new Error(`Profile not found for userId ${userId}`)
  return data
}

function cleanList(items: string[] | undefined): string[] {
  if (!items) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const trimmed = item.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(trimmed)
  }
  return out
}

function parseLooseDate(value: string | undefined | null): Date | null {
  if (!value) return null
  const padded = value.length === 4 ? `${value}-01` : value
  const date = new Date(padded)
  return Number.isNaN(date.getTime()) ? null : date
}

function toIsoOrNull(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null
}

function toProfileDto(data: ProfileWithRelations, authEmail?: string | null): ProfileDto {
  const { profile, workExperiences, educationEntries, skills, projects, certifications } = data
  const intelligenceMetadata = parseIntelligenceMetadata(profile.intelligenceMetadata)

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
      ...(typeof profile.notificationPreferences === 'object' && profile.notificationPreferences !== null
        ? (profile.notificationPreferences as Record<string, boolean>)
        : {}),
    },
    experience: workExperiences.map(
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
        confidence: item.confidence,
      })
    ),
    education: educationEntries.map(
      (item): EducationDto => ({
        id: item.id,
        institution: item.institution,
        degree: item.degree,
        fieldOfStudy: item.fieldOfStudy,
        startDate: toIsoOrNull(item.startDate),
        endDate: toIsoOrNull(item.endDate),
        graduationYear: item.graduationYear ?? (item.endDate ? item.endDate.getUTCFullYear() : null),
        grade: item.grade,
        description: item.description,
        source: item.source as 'user' | 'ai',
        confidence: item.confidence,
      })
    ),
    skills: skills.map(
      (item): SkillDto => ({
        id: item.id,
        name: item.name,
        category: item.category,
        proficiency: item.proficiency,
        yearsOfExperience: item.yearsOfExperience,
        evidence: item.evidence,
        source: item.source as 'user' | 'ai',
        confidence: item.confidence,
      })
    ),
    projects: projects.map(
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
        confidence: item.confidence,
      })
    ),
    certifications: certifications.map(
      (item): CertificationDto => ({
        id: item.id,
        name: item.name,
        issuer: item.issuer,
        issueDate: toIsoOrNull(item.issueDate),
        expiryDate: toIsoOrNull(item.expiryDate),
        credentialUrl: item.credentialUrl,
        source: item.source as 'user' | 'ai',
        confidence: item.confidence,
      })
    ),
    updatedAt: profile.updatedAt.toISOString(),
  }

  const intelligence = computeProfileIntelligence(baseProfile)

  return {
    ...baseProfile,
    completionPercent: intelligence.confirmedPercent,
    intelligence,
  }
}
