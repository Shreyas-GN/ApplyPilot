import { z } from "zod";

const urlOrEmpty = z
  .string()
  .trim()
  .refine((val) => val === "" || /^https?:\/\/.+/i.test(val), "Enter a valid URL")
  .optional();

const emailOrEmpty = z
  .string()
  .trim()
  .refine(
    (val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    "Enter a valid email address"
  )
  .optional();

const stringListSchema = (maxItems: number, maxLen: number) =>
  z.array(z.string().trim().min(1).max(maxLen)).max(maxItems).optional();

// Dates come from free-text resumes and manual entry alike, so we accept blank
// strings as well as "2021", "2021-05", or "2021-05-14".
const looseDateSchema = z
  .string()
  .trim()
  .refine(
    (val) => val === "" || /^\d{4}(-\d{2}(-\d{2})?)?$/.test(val),
    "Use YYYY, YYYY-MM, or YYYY-MM-DD"
  )
  .optional();

export const itemSourceSchema = z.enum(["user", "ai"]);
export const skillProficiencySchema = z.enum([
  "foundational",
  "working",
  "proficient",
  "expert",
]);
export const careerStageSchema = z.enum([
  "student",
  "early_career",
  "mid_level",
  "senior",
  "lead_staff",
  "executive",
  "career_switcher",
]);
export const experienceLevelSchema = z.enum([
  "internship",
  "entry",
  "mid",
  "senior",
  "lead",
  "executive",
]);

export const updateProfileSchema = z.object({
  fullName: z.string().trim().max(200).optional(),
  contactEmail: emailOrEmpty,
  phone: z.string().trim().max(50).optional(),
  location: z.string().trim().max(200).optional(),
  linkedinUrl: urlOrEmpty,
  githubUrl: urlOrEmpty,
  portfolioUrl: urlOrEmpty,
  headline: z.string().trim().max(200).optional(),
  summary: z.string().trim().max(5000).optional(),
  careerStage: careerStageSchema.or(z.literal("")).nullable().optional(),
  yearsOfExperience: z.number().int().min(0).max(80).nullable().optional(),
  employmentStatus: z.string().trim().max(50).optional(),
  confirmSection: z.enum(["personal_info", "professional_summary"]).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const workExperienceEntrySchema = z.object({
  id: z.string().uuid().optional(),
  company: z.string().trim().min(1, "Company is required").max(200),
  title: z.string().trim().min(1, "Title is required").max(200),
  location: z.string().trim().max(200).optional(),
  startDate: looseDateSchema,
  endDate: looseDateSchema,
  isCurrent: z.boolean().optional().default(false),
  description: z.string().trim().max(5000).optional(),
  responsibilities: stringListSchema(30, 500),
  achievements: stringListSchema(30, 500),
  technologies: stringListSchema(40, 100),
  source: itemSourceSchema.optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});
export const replaceWorkExperienceSchema = z.object({
  items: z.array(workExperienceEntrySchema).max(100),
});
export type ReplaceWorkExperienceInput = z.infer<typeof replaceWorkExperienceSchema>;

export const educationEntrySchema = z.object({
  id: z.string().uuid().optional(),
  institution: z.string().trim().min(1, "Institution is required").max(200),
  degree: z.string().trim().max(200).optional(),
  fieldOfStudy: z.string().trim().max(200).optional(),
  startDate: looseDateSchema,
  endDate: looseDateSchema,
  graduationYear: z.number().int().min(1940).max(2040).nullable().optional(),
  grade: z.string().trim().max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  source: itemSourceSchema.optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});
export const replaceEducationSchema = z.object({
  items: z.array(educationEntrySchema).max(50),
});
export type ReplaceEducationInput = z.infer<typeof replaceEducationSchema>;

export const skillEntrySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Skill name is required").max(100),
  category: z.string().trim().max(100).optional(),
  proficiency: skillProficiencySchema.or(z.literal("")).nullable().optional(),
  yearsOfExperience: z.number().min(0).max(60).nullable().optional(),
  evidence: z.string().trim().max(500).optional(),
  source: itemSourceSchema.optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});
export const replaceSkillsSchema = z.object({
  items: z.array(skillEntrySchema).max(200),
});
export type ReplaceSkillsInput = z.infer<typeof replaceSkillsSchema>;

export const projectEntrySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Project name is required").max(200),
  description: z.string().trim().max(3000).optional(),
  role: z.string().trim().max(150).optional(),
  technologies: stringListSchema(40, 100),
  contributions: stringListSchema(30, 500),
  url: urlOrEmpty,
  githubUrl: urlOrEmpty,
  liveUrl: urlOrEmpty,
  startDate: looseDateSchema,
  endDate: looseDateSchema,
  source: itemSourceSchema.optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});
export const replaceProjectsSchema = z.object({
  items: z.array(projectEntrySchema).max(100),
});
export type ReplaceProjectsInput = z.infer<typeof replaceProjectsSchema>;

export const certificationEntrySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Certification name is required").max(200),
  issuer: z.string().trim().max(200).optional(),
  issueDate: looseDateSchema,
  expiryDate: looseDateSchema,
  credentialUrl: urlOrEmpty,
  source: itemSourceSchema.optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});
export const replaceCertificationsSchema = z.object({
  items: z.array(certificationEntrySchema).max(100),
});
export type ReplaceCertificationsInput = z.infer<typeof replaceCertificationsSchema>;

export const workModeSchema = z.enum(["remote", "hybrid", "onsite"]);
export const employmentTypeSchema = z.enum([
  "full_time",
  "part_time",
  "contract",
  "internship",
  "freelance",
]);

export const notificationPreferencesSchema = z.object({
  followUpReminders: z.boolean(),
  jobMatchAlerts: z.boolean(),
  weeklyDigest: z.boolean(),
  productUpdates: z.boolean(),
});

export const updatePreferencesSchema = z.object({
  preferredTitles: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  preferredExperienceLevel: experienceLevelSchema.or(z.literal("")).nullable().optional(),
  preferredLocations: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  workMode: workModeSchema.or(z.literal("")).nullable().optional(),
  employmentTypes: z.array(employmentTypeSchema).max(10).optional(),
  expectedSalaryMin: z.number().int().min(0).max(10_000_000).nullable().optional(),
  expectedSalaryMax: z.number().int().min(0).max(10_000_000).nullable().optional(),
  preferredIndustries: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  excludedCompanies: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
  desiredRoles: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  adjacentRoles: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  excludedRoles: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  dismissSuggestedRole: z.string().trim().min(1).max(120).optional(),
  notificationPreferences: notificationPreferencesSchema.optional(),
});
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
