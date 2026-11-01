import { z } from "zod";

// The strict schema every AI-parsed (or user-corrected) resume payload must
// satisfy before it is trusted anywhere in the system — stored, shown to the
// user for review, or (after confirmation) written into the candidate's
// profile. See docs/AI_AGENTS.md §1/§7: no field here may represent
// information invented beyond what the source resume text actually contains.
//
// Used by: services/ai (shapes its own output), apps/workers (validates the
// AI service's HTTP response before persisting it), and apps/api (validates
// a user's PATCH of their own corrections before they're saved).

const sourceSchema = z.enum(["ai", "user"]);
const confidenceSchema = z.number().min(0).max(1);
const optionalText = (max: number) => z.string().trim().max(max).optional();

export const resumeParsedPersonalSchema = z.object({
  fullName: optionalText(200),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  phone: optionalText(50),
  location: optionalText(200),
  linkedinUrl: optionalText(500),
  githubUrl: optionalText(500),
  portfolioUrl: optionalText(500),
  headline: optionalText(200),
  summary: optionalText(5000),
});

export const resumeParsedExperienceSchema = z.object({
  company: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  location: optionalText(200),
  startDate: optionalText(20),
  endDate: optionalText(20),
  isCurrent: z.boolean().optional().default(false),
  description: optionalText(5000),
  confidence: confidenceSchema,
  source: sourceSchema.default("ai"),
});

export const resumeParsedEducationSchema = z.object({
  institution: z.string().trim().min(1).max(200),
  degree: optionalText(200),
  fieldOfStudy: optionalText(200),
  startDate: optionalText(20),
  endDate: optionalText(20),
  description: optionalText(2000),
  confidence: confidenceSchema,
  source: sourceSchema.default("ai"),
});

export const resumeParsedSkillSchema = z.object({
  name: z.string().trim().min(1).max(100),
  category: optionalText(100),
  confidence: confidenceSchema,
  source: sourceSchema.default("ai"),
});

export const resumeParsedProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: optionalText(3000),
  url: optionalText(500),
  startDate: optionalText(20),
  endDate: optionalText(20),
  confidence: confidenceSchema,
  source: sourceSchema.default("ai"),
});

export const resumeParsedCertificationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  issuer: optionalText(200),
  issueDate: optionalText(20),
  expiryDate: optionalText(20),
  credentialUrl: optionalText(500),
  confidence: confidenceSchema,
  source: sourceSchema.default("ai"),
});

export const resumeParsedDataSchema = z.object({
  personal: resumeParsedPersonalSchema,
  experience: z.array(resumeParsedExperienceSchema).max(100),
  education: z.array(resumeParsedEducationSchema).max(50),
  skills: z.array(resumeParsedSkillSchema).max(200),
  projects: z.array(resumeParsedProjectSchema).max(100),
  certifications: z.array(resumeParsedCertificationSchema).max(100),
  overallConfidence: confidenceSchema.optional(),
});
export type ResumeParsedData = z.infer<typeof resumeParsedDataSchema>;
