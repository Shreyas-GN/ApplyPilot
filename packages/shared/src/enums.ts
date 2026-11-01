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
