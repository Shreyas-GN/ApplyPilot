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
