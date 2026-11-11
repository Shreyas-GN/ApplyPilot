export interface AuthUserDto {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface WorkExperienceDto {
  id: string;
  company: string;
  title: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  source: "user" | "ai";
  confidence: number | null;
}

export interface EducationDto {
  id: string;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  source: "user" | "ai";
  confidence: number | null;
}

export interface SkillDto {
  id: string;
  name: string;
  category: string | null;
  source: "user" | "ai";
  confidence: number | null;
}

export interface ProjectDto {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  startDate: string | null;
  endDate: string | null;
  source: "user" | "ai";
  confidence: number | null;
}

export interface CertificationDto {
  id: string;
  name: string;
  issuer: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  credentialUrl: string | null;
  source: "user" | "ai";
  confidence: number | null;
}

export interface ProfileDto {
  fullName: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  headline: string | null;
  summary: string | null;
  yearsOfExperience: number | null;
  employmentStatus: string | null;
  preferredTitles: string[];
  preferredLocations: string[];
  workMode: string | null;
  employmentTypes: string[];
  expectedSalaryMin: number | null;
  expectedSalaryMax: number | null;
  preferredIndustries: string[];
  excludedCompanies: string[];
  completionPercent: number;
  experience: WorkExperienceDto[];
  education: EducationDto[];
  skills: SkillDto[];
  projects: ProjectDto[];
  certifications: CertificationDto[];
  updatedAt: string;
}

export interface ResumeDto {
  id: string;
  versionLabel: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  isPrimary: boolean;
  processingStatus: string;
  processingError: string | null;
  parsingJobStatus: string | null;
  reviewStatus: string | null;
  createdAt: string;
}

export interface ResumeParsedPersonalDto {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  headline?: string;
  summary?: string;
}

export interface ResumeParsedEntryDto {
  confidence: number;
  source: "ai" | "user";
}

export type ResumeParsedExperienceDto = ResumeParsedEntryDto & {
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
};

export type ResumeParsedEducationDto = ResumeParsedEntryDto & {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
};

export type ResumeParsedSkillDto = ResumeParsedEntryDto & {
  name: string;
  category?: string;
};

export type ResumeParsedProjectDto = ResumeParsedEntryDto & {
  name: string;
  description?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
};

export type ResumeParsedCertificationDto = ResumeParsedEntryDto & {
  name: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialUrl?: string;
};

export interface ResumeParsedDataDto {
  personal: ResumeParsedPersonalDto;
  experience: ResumeParsedExperienceDto[];
  education: ResumeParsedEducationDto[];
  skills: ResumeParsedSkillDto[];
  projects: ResumeParsedProjectDto[];
  certifications: ResumeParsedCertificationDto[];
  overallConfidence?: number;
}

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected";

export interface JobMatchBreakdown {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
}

export interface JobDto {
  id: string;
  source: string;
  externalId: string;
  company: string;
  title: string;
  location: string | null;
  workMode: string | null;
  employmentType: string | null;
  url: string;
  description: string;
  skills: string[];
  postedAt: string | null;
  createdAt: string;
  match: JobMatchBreakdown;
  applicationId: string | null;
  applicationStatus: ApplicationStatus | null;
}

export interface ApplicationEventDto {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

export interface ApplicationDto {
  id: string;
  jobId: string | null;
  company: string;
  title: string;
  location: string | null;
  url: string | null;
  status: ApplicationStatus;
  matchScore: number | null;
  notes: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  events?: ApplicationEventDto[];
}

export type TailoredDocumentType = "resume" | "cover_letter";
export type CoverLetterTone = "formal" | "conversational" | "concise";

export interface TailoredResumeExperienceItem {
  company: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  originalDescription: string | null;
  tailoredDescription: string;
}

export interface TailoredResumeContent {
  headline: string;
  summary: string;
  highlightedSkills: string[];
  experience: TailoredResumeExperienceItem[];
  keywordsUsed: string[];
  missingKeywords: string[];
  rationale: string;
}

export interface CoverLetterContent {
  subjectLine: string;
  greeting: string;
  bodyParagraphs: string[];
  closing: string;
  signature: string;
  keyPointsHighlighted: string[];
}

export interface TailoredDocumentDto {
  id: string;
  jobId: string | null;
  applicationId: string | null;
  company: string;
  jobTitle: string;
  type: TailoredDocumentType;
  tone: CoverLetterTone | null;
  content: TailoredResumeContent | CoverLetterContent;
  createdAt: string;
  updatedAt: string;
}

export interface ExtensionSessionDto {
  id: string;
  label: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface AuditLogDto {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

