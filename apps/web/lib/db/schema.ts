import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase';

// Enums
export const resumeProcessingStatusEnum = pgEnum('resume_processing_status', [
  'uploaded',
  'extracting',
  'parsing',
  'parsed',
  'failed',
]);

export const reviewStatusEnum = pgEnum('review_status', [
  'pending_review',
  'confirmed',
  'rejected',
]);

export const itemSourceEnum = pgEnum('item_source', ['user', 'ai']);

// 1. Profiles
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    fullName: text('full_name'),
    phone: text('phone'),
    location: text('location'),
    linkedinUrl: text('linkedin_url'),
    githubUrl: text('github_url'),
    portfolioUrl: text('portfolio_url'),
    headline: text('headline'),
    summary: text('summary'),
    yearsOfExperience: integer('years_of_experience'),
    employmentStatus: text('employment_status'),
    preferredTitles: text('preferred_titles')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    preferredLocations: text('preferred_locations')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    workMode: text('work_mode'),
    employmentTypes: text('employment_types')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    expectedSalaryMin: integer('expected_salary_min'),
    expectedSalaryMax: integer('expected_salary_max'),
    preferredIndustries: text('preferred_industries')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    excludedCompanies: text('excluded_companies')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  () => [
    pgPolicy('profiles_owner_policy', {
      for: 'all',
      to: authenticatedRole,
      using: sql`id = ${authUid}`,
      withCheck: sql`id = ${authUid}`,
    }),
  ]
);

// 2. Work Experiences
export const workExperiences = pgTable(
  'work_experiences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    company: text('company').notNull(),
    title: text('title').notNull(),
    location: text('location'),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    isCurrent: boolean('is_current').default(false).notNull(),
    description: text('description'),
    source: itemSourceEnum('source').default('user').notNull(),
    confidence: numeric('confidence', { precision: 4, scale: 3 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('work_experiences_user_id_idx').on(table.userId),
    pgPolicy('work_experiences_owner_policy', {
      for: 'all',
      to: authenticatedRole,
      using: sql`user_id = ${authUid}`,
      withCheck: sql`user_id = ${authUid}`,
    }),
  ]
);

// 3. Education Entries
export const educationEntries = pgTable(
  'education_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    institution: text('institution').notNull(),
    degree: text('degree'),
    fieldOfStudy: text('field_of_study'),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    description: text('description'),
    source: itemSourceEnum('source').default('user').notNull(),
    confidence: numeric('confidence', { precision: 4, scale: 3 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('education_entries_user_id_idx').on(table.userId),
    pgPolicy('education_entries_owner_policy', {
      for: 'all',
      to: authenticatedRole,
      using: sql`user_id = ${authUid}`,
      withCheck: sql`user_id = ${authUid}`,
    }),
  ]
);

// 4. Skills
export const skills = pgTable(
  'skills',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category'),
    source: itemSourceEnum('source').default('user').notNull(),
    confidence: numeric('confidence', { precision: 4, scale: 3 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('skills_user_id_idx').on(table.userId),
    uniqueIndex('skills_user_id_lower_name_idx').on(
      table.userId,
      sql`lower(${table.name})`
    ),
    pgPolicy('skills_owner_policy', {
      for: 'all',
      to: authenticatedRole,
      using: sql`user_id = ${authUid}`,
      withCheck: sql`user_id = ${authUid}`,
    }),
  ]
);

// 5. Projects
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    url: text('url'),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    source: itemSourceEnum('source').default('user').notNull(),
    confidence: numeric('confidence', { precision: 4, scale: 3 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('projects_user_id_idx').on(table.userId),
    pgPolicy('projects_owner_policy', {
      for: 'all',
      to: authenticatedRole,
      using: sql`user_id = ${authUid}`,
      withCheck: sql`user_id = ${authUid}`,
    }),
  ]
);

// 6. Certifications
export const certifications = pgTable(
  'certifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    issuer: text('issuer'),
    issueDate: timestamp('issue_date', { withTimezone: true }),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    credentialUrl: text('credential_url'),
    source: itemSourceEnum('source').default('user').notNull(),
    confidence: numeric('confidence', { precision: 4, scale: 3 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('certifications_user_id_idx').on(table.userId),
    pgPolicy('certifications_owner_policy', {
      for: 'all',
      to: authenticatedRole,
      using: sql`user_id = ${authUid}`,
      withCheck: sql`user_id = ${authUid}`,
    }),
  ]
);

// 7. Resumes
export const resumes = pgTable(
  'resumes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    versionLabel: text('version_label').notNull(),
    originalFilename: text('original_filename').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSizeBytes: integer('file_size_bytes').notNull(),
    storageKey: text('storage_key').notNull(),
    checksum: text('checksum'),
    isPrimary: boolean('is_primary').default(false).notNull(),
    processingStatus: resumeProcessingStatusEnum('processing_status')
      .default('uploaded')
      .notNull(),
    parseAttempts: integer('parse_attempts').default(0).notNull(),
    extractedText: text('extracted_text'),
    processingError: text('processing_error'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('resumes_user_id_idx').on(table.userId),
    pgPolicy('resumes_owner_policy', {
      for: 'all',
      to: authenticatedRole,
      using: sql`user_id = ${authUid}`,
      withCheck: sql`user_id = ${authUid}`,
    }),
  ]
);

// 8. Resume Parsed Data
export const resumeParsedData = pgTable(
  'resume_parsed_data',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    resumeId: uuid('resume_id')
      .notNull()
      .unique()
      .references(() => resumes.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    structuredData: jsonb('structured_data').notNull(),
    overallConfidence: numeric('overall_confidence', { precision: 4, scale: 3 }),
    reviewStatus: reviewStatusEnum('review_status')
      .default('pending_review')
      .notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('resume_parsed_data_user_id_idx').on(table.userId),
    pgPolicy('resume_parsed_data_owner_policy', {
      for: 'all',
      to: authenticatedRole,
      using: sql`user_id = ${authUid}`,
      withCheck: sql`user_id = ${authUid}`,
    }),
  ]
);

// 9. Audit Logs
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => authUsers.id, {
      onDelete: 'set null',
    }),
    action: text('action').notNull(),
    metadata: jsonb('metadata'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('audit_logs_user_id_created_at_idx').on(table.userId, table.createdAt),
    pgPolicy('audit_logs_owner_policy', {
      for: 'all',
      to: authenticatedRole,
      using: sql`user_id = ${authUid}`,
      withCheck: sql`user_id = ${authUid}`,
    }),
  ]
);
