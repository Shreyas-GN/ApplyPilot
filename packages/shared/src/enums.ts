// Enums shared across apps/api, apps/web, apps/extension, apps/workers.
// Kept in sync by hand with docs/DATABASE_SCHEMA.md and the Prisma schema
// (apps/api/prisma/schema.prisma) until Phase 1+ generates one from the other.

export enum AtsTier {
  NATIVE = "native",
  BEST_EFFORT = "best_effort",
  UNSUPPORTED = "unsupported",
}

export enum MatchStatus {
  NEW = "new",
  SAVED = "saved",
  DISMISSED = "dismissed",
  APPLIED = "applied",
}

export enum ApplicationMode {
  COPILOT = "copilot",
  AUTOPILOT = "autopilot",
}

export enum ApplicationStatus {
  QUEUED = "queued",
  PENDING_REVIEW = "pending_review",
  SUBMITTED = "submitted",
  FAILED = "failed",
  INTERVIEW = "interview",
  REJECTED = "rejected",
  OFFER = "offer",
  WITHDRAWN = "withdrawn",
}

export enum ApplicationEventType {
  FIELD_FILLED = "field_filled",
  STATUS_CHANGED = "status_changed",
  SUBMITTED = "submitted",
  FAILED = "failed",
  AI_DRAFT_GENERATED = "ai_draft_generated",
}

export enum NotificationType {
  NEW_MATCH = "new_match",
  STATUS_CHANGE = "status_change",
  AUTOMATION_FAILURE = "automation_failure",
}

export enum SubscriptionPlan {
  FREE = "free",
  PRO = "pro",
  POWER = "power",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  PAST_DUE = "past_due",
  CANCELED = "canceled",
}

export enum ConsentType {
  EXTENSION_PAIRING = "extension_pairing",
  AUTOPILOT_ENABLED = "autopilot_enabled",
  DATA_PROCESSING = "data_processing",
}

// --- Phase 1: auth, profile, resume -----------------------------------

export enum ResumeProcessingStatus {
  UPLOADED = "uploaded",
  EXTRACTING = "extracting",
  EXTRACTED = "extracted",
  PARSING = "parsing",
  PARSED = "parsed",
  FAILED = "failed",
}

export enum ResumeParsingJobStatus {
  QUEUED = "queued",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum ResumeReviewStatus {
  PENDING_REVIEW = "pending_review",
  CONFIRMED = "confirmed",
}

// Tags whether a profile-section record (experience, education, skill, ...)
// came from the user's own input or from AI resume parsing. See
// docs/AI_AGENTS.md — AI-generated and user-confirmed data must stay
// distinguishable even after confirmation.
export enum ProfileEntrySource {
  USER = "user",
  AI = "ai",
}

export enum WorkMode {
  REMOTE = "remote",
  HYBRID = "hybrid",
  ONSITE = "onsite",
}

export enum EmploymentType {
  FULL_TIME = "full_time",
  PART_TIME = "part_time",
  CONTRACT = "contract",
  INTERNSHIP = "internship",
  FREELANCE = "freelance",
}

export enum EmploymentStatus {
  EMPLOYED = "employed",
  UNEMPLOYED = "unemployed",
  STUDENT = "student",
  FREELANCE = "freelance",
}

export enum AuditAction {
  REGISTER = "register",
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILED = "login_failed",
  LOGOUT = "logout",
  TOKEN_REFRESH = "token_refresh",
  TOKEN_REFRESH_REUSE_DETECTED = "token_refresh_reuse_detected",
  PASSWORD_RESET_REQUESTED = "password_reset_requested",
  PASSWORD_RESET_COMPLETED = "password_reset_completed",
  EMAIL_VERIFICATION_SENT = "email_verification_sent",
  EMAIL_VERIFIED = "email_verified",
  PROFILE_UPDATED = "profile_updated",
  RESUME_UPLOADED = "resume_uploaded",
  RESUME_DELETED = "resume_deleted",
  RESUME_CONFIRMED = "resume_confirmed",
}
