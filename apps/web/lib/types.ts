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
  responsibilities?: string[];
  achievements?: string[];
  technologies?: string[];
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
  graduationYear?: number | null;
  grade?: string | null;
  description: string | null;
  source: "user" | "ai";
  confidence: number | null;
}

export interface SkillDto {
  id: string;
  name: string;
  category: string | null;
  proficiency?: string | null;
  yearsOfExperience?: number | null;
  evidence?: string | null;
  source: "user" | "ai";
  confidence: number | null;
}

export interface ProjectDto {
  id: string;
  name: string;
  description: string | null;
  role?: string | null;
  technologies?: string[];
  contributions?: string[];
  url: string | null;
  githubUrl?: string | null;
  liveUrl?: string | null;
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

export type ProfileSectionId =
  | "personal_info"
  | "professional_summary"
  | "skills"
  | "experience"
  | "education"
  | "projects"
  | "certifications"
  | "career_preferences"
  | "career_interests";

export type SectionProvenanceSource = "user" | "ai" | "empty";

export interface SectionCompletenessDto {
  id: ProfileSectionId;
  label: string;
  complete: boolean;
  confirmedCount: number;
  aiUnverifiedCount: number;
  provenance: SectionProvenanceSource;
  weight: number;
  earnedWeight: number;
}

export interface ProfileSuggestionDto {
  id: string;
  sectionId: ProfileSectionId;
  title: string;
  description: string;
  actionLabel: string;
  priority: "high" | "medium" | "low";
  kind: "verify_ai" | "complete_missing" | "enrich";
}

export interface AiRoleSuggestionDto {
  role: string;
  kind: "desired" | "adjacent";
  reason: string;
  source: "ai_suggested";
}

export interface ProfileIntelligenceMetadataDto {
  personalInfoSource?: "user" | "ai";
  summarySource?: "user" | "ai";
  dismissedRoleSuggestions?: string[];
}

export interface ProfileIntelligenceDto {
  confirmedPercent: number;
  totalWithAiPercent: number;
  unverifiedAiCount: number;
  confirmedItemCount: number;
  sections: SectionCompletenessDto[];
  suggestions: ProfileSuggestionDto[];
  aiSuggestedRoles: AiRoleSuggestionDto[];
}

export interface ProfileDto {
  fullName: string | null;
  email?: string | null;
  authEmail?: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  headline: string | null;
  summary: string | null;
  careerStage?: string | null;
  yearsOfExperience: number | null;
  employmentStatus: string | null;
  preferredTitles: string[];
  preferredExperienceLevel?: string | null;
  preferredLocations: string[];
  workMode: string | null;
  employmentTypes: string[];
  expectedSalaryMin: number | null;
  expectedSalaryMax: number | null;
  preferredIndustries: string[];
  excludedCompanies: string[];
  desiredRoles?: string[];
  adjacentRoles?: string[];
  excludedRoles?: string[];
  intelligenceMetadata?: ProfileIntelligenceMetadataDto | null;
  intelligence?: ProfileIntelligenceDto;
  notificationPreferences?: NotificationPreferences;
  completionPercent: number;
  experience: WorkExperienceDto[];
  education: EducationDto[];
  skills: SkillDto[];
  projects: ProjectDto[];
  certifications: CertificationDto[];
  updatedAt: string;
}

export interface NotificationPreferences {
  followUpReminders: boolean;
  jobMatchAlerts: boolean;
  weeklyDigest: boolean;
  productUpdates: boolean;
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

export type JobUserState = "saved" | "dismissed" | null;

export interface TransferableSkillMatch {
  candidateSkill: string;
  targetSkill: string;
  reason: string;
}

export interface JobMatchBreakdown {
  score: number;
  skillsScore: number;
  experienceScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  transferableSkills: TransferableSkillMatch[];
  strengths: string[];
  gaps: string[];
  reasons: string[];
  isAdjacentRole: boolean;
  adjacencyReason: string | null;
}

export interface JobIntelligenceBreakdown {
  summary: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  technicalRequirements: string[];
  seniorityLevel: string;
  expectedExperienceYears: string | null;
  companyAndRoleHighlights: string[];
}

export interface JobDto {
  id: string;
  source: string;
  externalId: string;
  company: string;
  title: string;
  location: string | null;
  normalizedLocation: string | null;
  locationCountry: string | null;
  isIndiaRemote: boolean | null;
  workMode: string | null;
  employmentType: string | null;
  url: string;
  description: string;
  skills: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  salaryText: string | null;
  experienceLevel: string | null;
  experienceText: string | null;
  postedAt: string | null;
  createdAt: string;
  match: JobMatchBreakdown;
  userState: JobUserState;
  applicationId: string | null;
  applicationStatus: ApplicationStatus | null;
}

export interface JobDetailDto extends JobDto {
  intelligence: JobIntelligenceBreakdown;
  tailoredDocumentsCount: number;
}

export interface ApplicationEventDto {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

export interface ApplicationChecklistState {
  screeningPrepared?: boolean;
  finalReviewed?: boolean;
}

export interface ApplicationReadiness {
  profileComplete: boolean;
  hasResume: boolean;
  tailoredResume: boolean;
  coverLetter: boolean;
  screeningPrepared: boolean;
  finalReviewed: boolean;
  completedCount: number;
  totalCount: number;
}

export interface ScreeningAnswerResult {
  answer: string;
  groundedFacts: string[];
  source: "claude" | "grounded_fallback";
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
  followUpAt: string | null;
  checklist: ApplicationChecklistState;
  readiness?: ApplicationReadiness;
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

