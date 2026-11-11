import Anthropic from '@anthropic-ai/sdk';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  applicationEvents,
  applications,
  jobs,
  tailoredDocuments,
} from '@/lib/db/schema';
import type {
  CoverLetterContent,
  CoverLetterTone,
  ProfileDto,
  TailoredDocumentDto,
  TailoredDocumentType,
  TailoredResumeContent,
} from '@/lib/types';
import { recordAudit } from './audit';
import { getProfile } from './profile';

export const tailoredResumeExperienceItemSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  startDate: z.string().nullable().default(null),
  endDate: z.string().nullable().default(null),
  originalDescription: z.string().nullable().default(null),
  tailoredDescription: z.string().min(1),
});

export const tailoredResumeContentSchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(1),
  highlightedSkills: z.array(z.string()).default([]),
  experience: z.array(tailoredResumeExperienceItemSchema).default([]),
  keywordsUsed: z.array(z.string()).default([]),
  missingKeywords: z.array(z.string()).default([]),
  rationale: z.string().default(''),
});

export const coverLetterContentSchema = z.object({
  subjectLine: z.string().min(1),
  greeting: z.string().min(1),
  bodyParagraphs: z.array(z.string().min(1)).min(1),
  closing: z.string().min(1),
  signature: z.string().min(1),
  keyPointsHighlighted: z.array(z.string()).default([]),
});

export interface ClaudeMessagesClient {
  messages: {
    create(params: {
      model: string;
      max_tokens: number;
      system: string;
      messages: { role: 'user'; content: string }[];
    }): Promise<{
      content: Array<{ type: string; text?: string }>;
    }>;
  };
}

export interface CreateTailoredDocumentInput {
  type: TailoredDocumentType;
  tone?: CoverLetterTone;
  jobId?: string;
  applicationId?: string;
  company?: string;
  jobTitle?: string;
  jobDescription?: string;
}

const RESUME_TAILOR_SYSTEM_PROMPT = `You tailor a candidate's verified profile into a targeted resume emphasis for a specific job posting.

STRICT NO-FABRICATION RULES:
1. Only use companies, job titles, dates, projects, education, and skills that explicitly exist in the candidate profile JSON provided by the user.
2. NEVER invent new employers, titles, dates, metrics, certifications, or skills not supported by the candidate profile.
3. If an important keyword from the job posting is absent from the candidate profile, put it in "missingKeywords" instead of pretending the candidate has it.
4. For each experience item you include, copy "company", "title", "startDate", "endDate", and "originalDescription" verbatim from the input profile, and write "tailoredDescription" by emphasizing and tightening relevant existing responsibilities.
5. Output ONLY a single valid JSON object (no markdown fences, no commentary) matching:
{
  "headline": "",
  "summary": "",
  "highlightedSkills": [""],
  "experience": [
    {
      "company": "",
      "title": "",
      "startDate": null,
      "endDate": null,
      "originalDescription": null,
      "tailoredDescription": ""
    }
  ],
  "keywordsUsed": [""],
  "missingKeywords": [""],
  "rationale": ""
}`;

const COVER_LETTER_SYSTEM_PROMPT = `You write a grounded, job-specific cover letter for a candidate based strictly on their verified profile and the target job posting.

STRICT NO-FABRICATION RULES:
1. Only cite companies, roles, projects, education, and skills explicitly present in the candidate profile JSON.
2. NEVER fabricate metrics, awards, employers, or skills.
3. Match the requested tone:
   - "formal": polished, structured, traditional professional voice.
   - "conversational": warm, direct, human, confident without slang.
   - "concise": crisp 2-3 short paragraphs focused purely on fit and impact.
4. Output ONLY a single valid JSON object (no markdown fences, no commentary) matching:
{
  "subjectLine": "",
  "greeting": "",
  "bodyParagraphs": ["", ""],
  "closing": "",
  "signature": "",
  "keyPointsHighlighted": [""]
}`;

export function cleanJsonFence(raw: string): string {
  const stripped = raw.trim();
  const match = stripped.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match && match[1] ? match[1].trim() : stripped;
}

export function buildCandidateContext(profile: ProfileDto) {
  return {
    fullName: profile.fullName,
    location: profile.location,
    headline: profile.headline,
    summary: profile.summary,
    yearsOfExperience: profile.yearsOfExperience,
    skills: profile.skills.map((s) => s.name),
    experience: profile.experience.map((e) => ({
      company: e.company,
      title: e.title,
      startDate: e.startDate,
      endDate: e.isCurrent ? 'Present' : e.endDate,
      description: e.description,
    })),
    education: profile.education.map((ed) => ({
      institution: ed.institution,
      degree: ed.degree,
      fieldOfStudy: ed.fieldOfStudy,
    })),
    projects: profile.projects.map((p) => ({
      name: p.name,
      description: p.description,
    })),
  };
}

function resolveClaudeClient(client?: ClaudeMessagesClient): {
  claude: ClaudeMessagesClient;
  model: string;
} {
  if (client) {
    return {
      claude: client,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    };
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not configured. Add it to your environment to enable AI tailoring.'
    );
  }
  return {
    claude: new Anthropic({ apiKey }) as unknown as ClaudeMessagesClient,
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
  };
}

async function runClaudeJson<T>(
  system: string,
  userContent: string,
  schema: z.ZodType<T>,
  injectedClient?: ClaudeMessagesClient
): Promise<T> {
  const { claude, model } = resolveClaudeClient(injectedClient);

  const response = await claude.messages.create({
    model,
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: userContent }],
  });

  const rawText = response.content
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text ?? '')
    .join('');

  try {
    const parsed = JSON.parse(cleanJsonFence(rawText));
    return schema.parse(parsed);
  } catch (error) {
    console.error('Claude tailoring response validation failed:', rawText, error);
    throw new Error(
      'AI tailoring returned an unexpected response format. Please retry.'
    );
  }
}

export async function tailorResumeWithClaude(
  profile: ProfileDto,
  job: { company: string; title: string; description: string },
  client?: ClaudeMessagesClient
): Promise<TailoredResumeContent> {
  const candidate = buildCandidateContext(profile);
  const userMessage = JSON.stringify({
    targetJob: job,
    candidateProfile: candidate,
  });

  return runClaudeJson(
    RESUME_TAILOR_SYSTEM_PROMPT,
    userMessage,
    tailoredResumeContentSchema,
    client
  );
}

export async function draftCoverLetterWithClaude(
  profile: ProfileDto,
  job: { company: string; title: string; description: string },
  tone: CoverLetterTone,
  client?: ClaudeMessagesClient
): Promise<CoverLetterContent> {
  const candidate = buildCandidateContext(profile);
  const userMessage = JSON.stringify({
    tone,
    targetJob: job,
    candidateProfile: candidate,
  });

  return runClaudeJson(
    COVER_LETTER_SYSTEM_PROMPT,
    userMessage,
    coverLetterContentSchema,
    client
  );
}

function toTailoredDocumentDto(
  row: typeof tailoredDocuments.$inferSelect
): TailoredDocumentDto {
  return {
    id: row.id,
    jobId: row.jobId,
    applicationId: row.applicationId,
    company: row.company,
    jobTitle: row.jobTitle,
    type: row.type as TailoredDocumentType,
    tone: (row.tone as CoverLetterTone | null) ?? null,
    content: row.content as TailoredResumeContent | CoverLetterContent,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listTailoredDocuments(
  userId: string,
  filters?: { jobId?: string; applicationId?: string }
): Promise<TailoredDocumentDto[]> {
  const conditions = [eq(tailoredDocuments.userId, userId)];
  if (filters?.jobId) {
    conditions.push(eq(tailoredDocuments.jobId, filters.jobId));
  }
  if (filters?.applicationId) {
    conditions.push(eq(tailoredDocuments.applicationId, filters.applicationId));
  }

  const rows = await db
    .select()
    .from(tailoredDocuments)
    .where(and(...conditions))
    .orderBy(desc(tailoredDocuments.createdAt))
    .limit(50);

  return rows.map(toTailoredDocumentDto);
}

export async function createTailoredDocument(
  userId: string,
  input: CreateTailoredDocumentInput,
  client?: ClaudeMessagesClient
): Promise<TailoredDocumentDto> {
  let resolvedJobId = input.jobId ?? null;
  const resolvedAppId = input.applicationId ?? null;
  let company = input.company?.trim() ?? '';
  let jobTitle = input.jobTitle?.trim() ?? '';
  let jobDescription = input.jobDescription?.trim() ?? '';

  if (resolvedAppId) {
    const [appRow] = await db
      .select()
      .from(applications)
      .where(
        and(eq(applications.id, resolvedAppId), eq(applications.userId, userId))
      )
      .limit(1);

    if (!appRow) {
      throw new Error('Application not found.');
    }
    if (!company) company = appRow.company;
    if (!jobTitle) jobTitle = appRow.title;
    if (!resolvedJobId && appRow.jobId) resolvedJobId = appRow.jobId;
  }

  if (resolvedJobId) {
    const [jobRow] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, resolvedJobId))
      .limit(1);

    if (!jobRow) {
      throw new Error('Job posting not found.');
    }
    if (!company) company = jobRow.company;
    if (!jobTitle) jobTitle = jobRow.title;
    if (!jobDescription) jobDescription = jobRow.description;
  }

  if (!company || !jobTitle) {
    throw new Error('Company and job title are required.');
  }
  if (!jobDescription) {
    jobDescription = `${jobTitle} at ${company}`;
  }

  const profile = await getProfile(userId);
  const hasCandidateSignal =
    Boolean(profile.summary?.trim()) ||
    Boolean(profile.headline?.trim()) ||
    profile.experience.length > 0 ||
    profile.skills.length > 0 ||
    profile.projects.length > 0;

  if (!hasCandidateSignal) {
    throw new Error(
      'Please add profile details or confirm a parsed resume before tailoring.'
    );
  }

  const tone: CoverLetterTone | null =
    input.type === 'cover_letter' ? input.tone ?? 'conversational' : null;

  const content =
    input.type === 'resume'
      ? await tailorResumeWithClaude(
          profile,
          { company, title: jobTitle, description: jobDescription },
          client
        )
      : await draftCoverLetterWithClaude(
          profile,
          { company, title: jobTitle, description: jobDescription },
          tone ?? 'conversational',
          client
        );

  const [created] = await db
    .insert(tailoredDocuments)
    .values({
      userId,
      jobId: resolvedJobId,
      applicationId: resolvedAppId,
      company,
      jobTitle,
      type: input.type,
      tone,
      content,
    })
    .returning();

  if (!created) {
    throw new Error('Failed to save tailored document.');
  }

  if (resolvedAppId) {
    await db.insert(applicationEvents).values({
      applicationId: resolvedAppId,
      userId,
      type: 'tailoring',
      description:
        input.type === 'resume'
          ? `Generated tailored resume for ${jobTitle}`
          : `Drafted ${tone} cover letter for ${jobTitle}`,
    });
  }

  await recordAudit(userId, 'tailored_document_created', {
    documentId: created.id,
    type: input.type,
    jobId: resolvedJobId,
    applicationId: resolvedAppId,
  });

  return toTailoredDocumentDto(created);
}

export async function updateTailoredDocument(
  userId: string,
  documentId: string,
  content: unknown
): Promise<TailoredDocumentDto | null> {
  const [existing] = await db
    .select()
    .from(tailoredDocuments)
    .where(
      and(
        eq(tailoredDocuments.id, documentId),
        eq(tailoredDocuments.userId, userId)
      )
    )
    .limit(1);

  if (!existing) return null;

  const schema =
    existing.type === 'resume'
      ? tailoredResumeContentSchema
      : coverLetterContentSchema;
  const validated = schema.parse(content);

  const [updated] = await db
    .update(tailoredDocuments)
    .set({
      content: validated,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(tailoredDocuments.id, documentId),
        eq(tailoredDocuments.userId, userId)
      )
    )
    .returning();

  return updated ? toTailoredDocumentDto(updated) : null;
}

export async function deleteTailoredDocument(
  userId: string,
  documentId: string
): Promise<boolean> {
  const deleted = await db
    .delete(tailoredDocuments)
    .where(
      and(
        eq(tailoredDocuments.id, documentId),
        eq(tailoredDocuments.userId, userId)
      )
    )
    .returning({ id: tailoredDocuments.id });

  return deleted.length > 0;
}
