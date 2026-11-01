import { z } from "zod";

const urlOrEmpty = z
  .string()
  .trim()
  .refine((val) => val === "" || /^https?:\/\/.+/i.test(val), "Enter a valid URL")
  .optional();

// Dates come from free-text resumes and manual entry alike, so we accept any
// of "2021", "2021-05", "2021-05-14" rather than forcing full ISO precision.
const looseDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, "Use YYYY, YYYY-MM, or YYYY-MM-DD")
  .optional();

export const updateProfileSchema = z.object({
  fullName: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(50).optional(),
  location: z.string().trim().max(200).optional(),
  linkedinUrl: urlOrEmpty,
  githubUrl: urlOrEmpty,
  portfolioUrl: urlOrEmpty,
  headline: z.string().trim().max(200).optional(),
  summary: z.string().trim().max(5000).optional(),
  yearsOfExperience: z.number().int().min(0).max(80).optional(),
  employmentStatus: z.string().trim().max(50).optional(),
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
  description: z.string().trim().max(2000).optional(),
});
export const replaceEducationSchema = z.object({
  items: z.array(educationEntrySchema).max(50),
});
export type ReplaceEducationInput = z.infer<typeof replaceEducationSchema>;

export const skillEntrySchema = z.object({
  name: z.string().trim().min(1, "Skill name is required").max(100),
  category: z.string().trim().max(100).optional(),
});
export const replaceSkillsSchema = z.object({
  items: z.array(skillEntrySchema).max(200),
});
export type ReplaceSkillsInput = z.infer<typeof replaceSkillsSchema>;

export const projectEntrySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Project name is required").max(200),
  description: z.string().trim().max(3000).optional(),
  url: urlOrEmpty,
  startDate: looseDateSchema,
  endDate: looseDateSchema,
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

export const updatePreferencesSchema = z.object({
  preferredTitles: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  preferredLocations: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  workMode: workModeSchema.optional(),
  employmentTypes: z.array(employmentTypeSchema).max(10).optional(),
  expectedSalaryMin: z.number().int().min(0).max(10_000_000).optional(),
  expectedSalaryMax: z.number().int().min(0).max(10_000_000).optional(),
  preferredIndustries: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  excludedCompanies: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
});
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
