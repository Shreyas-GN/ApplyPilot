import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import type {
  CoverLetterContent,
  CoverLetterTone,
  ProfileDto,
  ScreeningAnswerResult,
  TailoredDocumentDto,
  TailoredDocumentType,
  TailoredResumeContent,
} from '@/lib/types'
import { recordAudit } from './audit'
import { getProfile } from './profile'

export const tailoredResumeExperienceItemSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  startDate: z.string().nullable().default(null),
  endDate: z.string().nullable().default(null),
  originalDescription: z.string().nullable().default(null),
  tailoredDescription: z.string().min(1),
})

export const tailoredResumeContentSchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(1),
  highlightedSkills: z.array(z.string()).default([]),
  experience: z.array(tailoredResumeExperienceItemSchema).default([]),
  keywordsUsed: z.array(z.string()).default([]),
  missingKeywords: z.array(z.string()).default([]),
  rationale: z.string().default(''),
})

export const coverLetterContentSchema = z.object({
  subjectLine: z.string().min(1),
  greeting: z.string().min(1),
  bodyParagraphs: z.array(z.string().min(1)).min(1),
  closing: z.string().min(1),
  signature: z.string().min(1),
  keyPointsHighlighted: z.array(z.string()).default([]),
})

export interface ClaudeMessagesClient {
  messages: {
    create(params: {
      model: string
      max_tokens: number
      system: string
      messages: { role: 'user'; content: string }[]
    }): Promise<{ content: Array<{ type: string; text?: string }> }>
  }
}

export interface CreateTailoredDocumentInput {
  type: TailoredDocumentType
  tone?: CoverLetterTone
  jobId?: string
  applicationId?: string
  company?: string
  jobTitle?: string
  jobDescription?: string
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
}`

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
}`

const SCREENING_ANSWER_SYSTEM_PROMPT = `You answer a job application screening question concisely and persuasively in first-person voice, strictly grounded in the candidate's verified profile.

STRICT NO-FABRICATION RULES:
1. Only cite skills, companies, job titles, years of experience, education, and projects explicitly present in candidateProfile.
2. NEVER invent metrics, years of experience, authorizations, or technologies the candidate does not have.
3. Keep the answer concise (2-5 sentences), direct, and tailored to the question and target role.
4. Output ONLY a single valid JSON object (no markdown fences) matching:
{
  "answer": "",
  "groundedFacts": [""]
}`

export const screeningAnswerSchema = z.object({
  answer: z.string().min(1),
  groundedFacts: z.array(z.string()).default([]),
})

export interface ScreeningQuestionInput {
  question: string
  jobId?: string
  applicationId?: string
  company?: string
  jobTitle?: string
  jobDescription?: string
}

export function cleanJsonFence(raw: string): string {
  const stripped = raw.trim()
  const match = stripped.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return match && match[1] ? match[1].trim() : stripped
}

export function buildCandidateContext(profile: ProfileDto) {
  const summaryConfirmed = profile.intelligenceMetadata?.summarySource !== 'ai'
  const confirmedSkills = profile.skills.filter((s) => s.source !== 'ai')
  const confirmedExperience = profile.experience.filter((e) => e.source !== 'ai')
  const confirmedEducation = profile.education.filter((ed) => ed.source !== 'ai')
  const confirmedProjects = profile.projects.filter((p) => p.source !== 'ai')

  return {
    fullName: profile.fullName,
    location: profile.location,
    headline: summaryConfirmed ? profile.headline : null,
    summary: summaryConfirmed ? profile.summary : null,
    yearsOfExperience: profile.yearsOfExperience,
    skills: confirmedSkills.map((s) => s.name),
    experience: confirmedExperience.map((e) => ({
      company: e.company,
      title: e.title,
      startDate: e.startDate,
      endDate: e.isCurrent ? 'Present' : e.endDate,
      description: e.description,
      responsibilities: e.responsibilities ?? [],
      achievements: e.achievements ?? [],
      technologies: e.technologies ?? [],
    })),
    education: confirmedEducation.map((ed) => ({
      institution: ed.institution,
      degree: ed.degree,
      fieldOfStudy: ed.fieldOfStudy,
      graduationYear: ed.graduationYear ?? null,
    })),
    projects: confirmedProjects.map((p) => ({
      name: p.name,
      role: p.role ?? null,
      description: p.description,
      technologies: p.technologies ?? [],
      contributions: p.contributions ?? [],
    })),
  }
}

function resolveClaudeClient(client?: ClaudeMessagesClient): { claude: ClaudeMessagesClient; model: string } {
  if (client) return { claude: client, model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022' }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured. Add it to your environment to enable AI tailoring.')
  return {
    claude: new Anthropic({ apiKey }) as unknown as ClaudeMessagesClient,
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
  }
}

async function runClaudeJson<T>(
  system: string,
  userContent: string,
  schema: z.ZodType<T>,
  injectedClient?: ClaudeMessagesClient
): Promise<T> {
  const { claude, model } = resolveClaudeClient(injectedClient)
  const response = await claude.messages.create({
    model,
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: userContent }],
  })
  const rawText = response.content
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text ?? '')
    .join('')
  try {
    return schema.parse(JSON.parse(cleanJsonFence(rawText)))
  } catch (error) {
    console.error('Claude tailoring response validation failed:', rawText, error)
    throw new Error('AI tailoring returned an unexpected response format. Please retry.')
  }
}

export async function tailorResumeWithClaude(
  profile: ProfileDto,
  job: { company: string; title: string; description: string },
  client?: ClaudeMessagesClient
): Promise<TailoredResumeContent> {
  return runClaudeJson(
    RESUME_TAILOR_SYSTEM_PROMPT,
    JSON.stringify({ targetJob: job, candidateProfile: buildCandidateContext(profile) }),
    tailoredResumeContentSchema,
    client
  )
}

export async function draftCoverLetterWithClaude(
  profile: ProfileDto,
  job: { company: string; title: string; description: string },
  tone: CoverLetterTone,
  client?: ClaudeMessagesClient
): Promise<CoverLetterContent> {
  return runClaudeJson(
    COVER_LETTER_SYSTEM_PROMPT,
    JSON.stringify({ tone, targetJob: job, candidateProfile: buildCandidateContext(profile) }),
    coverLetterContentSchema,
    client
  )
}

export function buildGroundedScreeningAnswer(
  profile: ProfileDto,
  job: { company: string; title: string; description: string },
  question: string
): ScreeningAnswerResult {
  const skills = profile.skills.filter((s) => s.source !== 'ai').map((s) => s.name).slice(0, 5)
  const topExp = profile.experience.find((e) => e.source !== 'ai')
  const topProject = profile.projects.find((p) => p.source !== 'ai')
  const summaryConfirmed = profile.intelligenceMetadata?.summarySource !== 'ai'
  const confirmedHeadline = summaryConfirmed ? profile.headline : null
  const confirmedSummary = summaryConfirmed ? profile.summary : null
  const qLower = question.toLowerCase()
  const facts: string[] = []
  const parts: string[] = []

  if (profile.yearsOfExperience != null) facts.push(`${profile.yearsOfExperience} years of experience`)
  if (topExp) facts.push(`${topExp.title} at ${topExp.company}`)
  if (skills.length > 0) facts.push(`Skills: ${skills.join(', ')}`)

  if (/\b(why|interest|motivat|excited|company)\b/.test(qLower)) {
    const companyText = job.company ? ` at ${job.company}` : ''
    const roleText = job.title ? ` the ${job.title} role` : ' this role'
    parts.push(`I am excited about${roleText}${companyText} because it aligns closely with my background${confirmedHeadline ? ` as a ${confirmedHeadline}` : ''}.`)
    if (topExp) {
      parts.push(`Most recently as ${topExp.title} at ${topExp.company}, I worked extensively with ${skills.length > 0 ? skills.slice(0, 3).join(', ') : 'core engineering workflows'}${topExp.description ? ` (${topExp.description.slice(0, 140)})` : ''}.`)
    }
  } else if (/\b(project|challenge|proud|example|architecture|built)\b/.test(qLower)) {
    if (topProject) {
      facts.push(`Project: ${topProject.name}`)
      parts.push(`A representative example is ${topProject.name}${topProject.description ? `: ${topProject.description.slice(0, 220)}` : '.'}`)
    } else if (topExp) {
      parts.push(`In my role as ${topExp.title} at ${topExp.company}, ${topExp.description ? topExp.description.slice(0, 220) : `I delivered production work using ${skills.slice(0, 3).join(', ')}.`}`)
    }
  } else {
    if (profile.yearsOfExperience != null) {
      parts.push(`I bring ${profile.yearsOfExperience} years of professional experience${skills.length > 0 ? ` working with ${skills.join(', ')}` : ''}.`)
    } else if (skills.length > 0) {
      parts.push(`My hands-on background covers ${skills.join(', ')}.`)
    }
    if (topExp) {
      parts.push(`As ${topExp.title} at ${topExp.company}, ${topExp.description ? topExp.description.slice(0, 180) : 'I applied these capabilities in production.'}`)
    }
  }

  if (parts.length === 0) {
    parts.push(confirmedSummary?.trim() || `Based on my verified profile${skills.length > 0 ? ` (${skills.join(', ')})` : ''}, I am well positioned to contribute to ${job.title || 'this team'}${job.company ? ` at ${job.company}` : ''}.`)
  }

  return { answer: parts.join(' '), groundedFacts: facts, source: 'grounded_fallback' }
}

export async function generateScreeningAnswer(
  profile: ProfileDto,
  job: { company: string; title: string; description: string },
  question: string,
  client?: ClaudeMessagesClient
): Promise<ScreeningAnswerResult> {
  if (!client && !process.env.ANTHROPIC_API_KEY) {
    return buildGroundedScreeningAnswer(profile, job, question)
  }
  const parsed = await runClaudeJson(
    SCREENING_ANSWER_SYSTEM_PROMPT,
    JSON.stringify({ question, targetJob: job, candidateProfile: buildCandidateContext(profile) }),
    screeningAnswerSchema,
    client
  )
  return { answer: parsed.answer, groundedFacts: parsed.groundedFacts, source: 'claude' }
}

export async function answerScreeningQuestion(
  userId: string,
  input: ScreeningQuestionInput
): Promise<ScreeningAnswerResult> {
  const profile = await getProfile(userId)
  let company = input.company?.trim() ?? ''
  let title = input.jobTitle?.trim() ?? ''
  let description = input.jobDescription?.trim() ?? ''

  if (input.jobId) {
    const jobRow = await prisma.job.findUnique({ where: { id: input.jobId } })
    if (jobRow) {
      company = company || jobRow.company
      title = title || jobRow.title
      description = description || jobRow.description
    }
  }

  if (input.applicationId && (!company || !title)) {
    const appRow = await prisma.application.findFirst({
      where: { id: input.applicationId, userId },
    })
    if (appRow) {
      company = company || appRow.company
      title = title || appRow.title
      if (appRow.jobId && !description) {
        const linkedJob = await prisma.job.findUnique({
          where: { id: appRow.jobId },
          select: { description: true },
        })
        if (linkedJob) description = linkedJob.description
      }
    }
  }

  const result = await generateScreeningAnswer(profile, { company, title, description }, input.question.trim())

  await recordAudit(userId, 'screening_answer_generated', {
    company: company || null,
    jobTitle: title || null,
    source: result.source,
  })

  return result
}

function toTailoredDocumentDto(
  row: Awaited<ReturnType<typeof prisma.tailoredDocument.findUnique>> & object
): TailoredDocumentDto {
  return {
    id: row.id,
    jobId: row.jobId,
    applicationId: row.applicationId,
    company: row.company,
    jobTitle: row.jobTitle,
    type: row.type as TailoredDocumentType,
    tone: (row.tone as CoverLetterTone | null) ?? null,
    content: row.content as unknown as TailoredResumeContent | CoverLetterContent,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listTailoredDocuments(
  userId: string,
  filters?: { jobId?: string; applicationId?: string }
): Promise<TailoredDocumentDto[]> {
  const rows = await prisma.tailoredDocument.findMany({
    where: {
      userId,
      ...(filters?.jobId ? { jobId: filters.jobId } : {}),
      ...(filters?.applicationId ? { applicationId: filters.applicationId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return rows.map(toTailoredDocumentDto)
}

export async function createTailoredDocument(
  userId: string,
  input: CreateTailoredDocumentInput,
  client?: ClaudeMessagesClient
): Promise<TailoredDocumentDto> {
  let resolvedJobId = input.jobId ?? null
  const resolvedAppId = input.applicationId ?? null
  let company = input.company?.trim() ?? ''
  let jobTitle = input.jobTitle?.trim() ?? ''
  let jobDescription = input.jobDescription?.trim() ?? ''

  if (resolvedAppId) {
    const appRow = await prisma.application.findFirst({ where: { id: resolvedAppId, userId } })
    if (!appRow) throw new Error('Application not found.')
    if (!company) company = appRow.company
    if (!jobTitle) jobTitle = appRow.title
    if (!resolvedJobId && appRow.jobId) resolvedJobId = appRow.jobId
  }

  if (resolvedJobId) {
    const jobRow = await prisma.job.findUnique({ where: { id: resolvedJobId } })
    if (!jobRow) throw new Error('Job posting not found.')
    if (!company) company = jobRow.company
    if (!jobTitle) jobTitle = jobRow.title
    if (!jobDescription) jobDescription = jobRow.description
  }

  if (!company || !jobTitle) throw new Error('Company and job title are required.')
  if (!jobDescription) jobDescription = `${jobTitle} at ${company}`

  const profile = await getProfile(userId)
  const summaryConfirmed = profile.intelligenceMetadata?.summarySource !== 'ai'
  const hasCandidateSignal =
    (summaryConfirmed && Boolean(profile.summary?.trim())) ||
    (summaryConfirmed && Boolean(profile.headline?.trim())) ||
    profile.experience.some((e) => e.source !== 'ai') ||
    profile.skills.some((s) => s.source !== 'ai') ||
    profile.projects.some((p) => p.source !== 'ai')

  if (!hasCandidateSignal) {
    throw new Error('Please add profile details or confirm a parsed resume before tailoring.')
  }

  const tone: CoverLetterTone | null =
    input.type === 'cover_letter' ? input.tone ?? 'conversational' : null

  const content =
    input.type === 'resume'
      ? await tailorResumeWithClaude(profile, { company, title: jobTitle, description: jobDescription }, client)
      : await draftCoverLetterWithClaude(
          profile,
          { company, title: jobTitle, description: jobDescription },
          tone ?? 'conversational',
          client
        )

  const created = await prisma.tailoredDocument.create({
    data: {
      userId,
      jobId: resolvedJobId,
      applicationId: resolvedAppId,
      company,
      jobTitle,
      type: input.type,
      tone,
      content: content as object,
    },
  })

  if (resolvedAppId) {
    await prisma.applicationEvent.create({
      data: {
        applicationId: resolvedAppId,
        userId,
        type: 'tailoring',
        description:
          input.type === 'resume'
            ? `Generated tailored resume for ${jobTitle}`
            : `Drafted ${tone} cover letter for ${jobTitle}`,
      },
    })
  }

  await recordAudit(userId, 'tailored_document_created', {
    documentId: created.id,
    type: input.type,
    jobId: resolvedJobId,
    applicationId: resolvedAppId,
  })

  return toTailoredDocumentDto(created)
}

export async function updateTailoredDocument(
  userId: string,
  documentId: string,
  content: unknown
): Promise<TailoredDocumentDto | null> {
  const existing = await prisma.tailoredDocument.findFirst({ where: { id: documentId, userId } })
  if (!existing) return null

  const schema = existing.type === 'resume' ? tailoredResumeContentSchema : coverLetterContentSchema
  const validated = schema.parse(content)

  const updated = await prisma.tailoredDocument.update({
    where: { id: documentId },
    data: { content: validated as object, updatedAt: new Date() },
  })

  return toTailoredDocumentDto(updated)
}

export async function deleteTailoredDocument(userId: string, documentId: string): Promise<boolean> {
  const deleted = await prisma.tailoredDocument.deleteMany({ where: { id: documentId, userId } })
  return deleted.count > 0
}
