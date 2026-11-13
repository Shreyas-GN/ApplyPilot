
import { db } from '@/lib/db';
import { resumeParsedData, resumes } from '@/lib/db/schema';
import { createAdminClient } from '@/lib/supabase/admin';
import Anthropic from '@anthropic-ai/sdk';
import {
  resumeParsedDataSchema,
  type ResumeParsedData,
} from '@applyfocus/validators';
import { eq } from 'drizzle-orm';
import mammoth from 'mammoth';
import { extractText } from 'unpdf';

const SYSTEM_PROMPT = `You extract structured information from resume text for a job-search product. You must follow these rules exactly:

1. Only output information that is explicitly present in the resume text. Never invent, infer, or guess an employer, job title, date, school, certification, or skill that is not written in the text.
2. If a date is ambiguous or missing, leave it empty rather than guessing.
3. For every entry you output, include a "confidence" number from 0 to 1 reflecting how certain you are the entry is both present and correctly transcribed from the text.
4. Set "source" to "ai" on every entry you output.
5. Output ONLY a single JSON object matching this exact shape, with no commentary, no markdown code fences, and no extra top-level keys:

{
  "personal": {"fullName": "", "email": "", "phone": "", "location": "", "linkedinUrl": "", "githubUrl": "", "portfolioUrl": "", "headline": "", "summary": ""},
  "experience": [{"company": "", "title": "", "location": "", "startDate": "", "endDate": "", "isCurrent": false, "description": "", "confidence": 0.0, "source": "ai"}],
  "education": [{"institution": "", "degree": "", "fieldOfStudy": "", "startDate": "", "endDate": "", "description": "", "confidence": 0.0, "source": "ai"}],
  "skills": [{"name": "", "category": "", "confidence": 0.0, "source": "ai"}],
  "projects": [{"name": "", "description": "", "url": "", "startDate": "", "endDate": "", "confidence": 0.0, "source": "ai"}],
  "certifications": [{"name": "", "issuer": "", "issueDate": "", "expiryDate": "", "credentialUrl": "", "confidence": 0.0, "source": "ai"}],
  "overallConfidence": 0.0
}

Omit any personal field you cannot find rather than leaving it as an empty string. Omit entire sections (as empty arrays) you find no evidence for.`;

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === 'application/pdf') {
    const { text } = await extractText(new Uint8Array(buffer));
    const extracted = Array.isArray(text) ? text.join('\n') : text;
    if (!extracted || !extracted.trim()) {
      throw new Error(
        'Could not extract text from this PDF. It may be scanned or image-only.'
      );
    }
    return extracted.trim();
  }

  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    const extracted = result.value;
    if (!extracted || !extracted.trim()) {
      throw new Error('Could not extract text from this DOCX file.');
    }
    return extracted.trim();
  }

  throw new Error(`Unsupported mime type: ${mimeType}`);
}

function cleanJsonFence(raw: string): string {
  const stripped = raw.trim();
  const match = stripped.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return match && match[1] ? match[1].trim() : stripped;
}

export async function parseResumeWithClaude(
  text: string
): Promise<ResumeParsedData> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not configured. Please add it to .env.local to enable AI parsing.'
    );
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Resume text:\n\n${text}` }],
  });

  const rawText = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  try {
    const parsed = JSON.parse(cleanJsonFence(rawText));
    return resumeParsedDataSchema.parse(parsed);
  } catch (error) {
    console.error('Claude parsing response validation failed:', rawText, error);
    throw new Error(
      'Failed to parse resume into structured JSON. Please retry.'
    );
  }
}

export async function processResumeBackground(
  resumeId: string,
  userId: string
): Promise<void> {
  try {
    const [resume] = await db
      .select()
      .from(resumes)
      .where(eq(resumes.id, resumeId))
      .limit(1);

    if (!resume) {
      console.error(`Resume ${resumeId} not found for background parsing`);
      return;
    }

    // Step 1: Extracting
    await db
      .update(resumes)
      .set({
        processingStatus: 'extracting',
        processingError: null,
      })
      .where(eq(resumes.id, resumeId));

    const supabase = createAdminClient();
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(resume.storageKey);

    if (downloadError || !fileBlob) {
      throw new Error(
        `Failed to download resume from storage: ${downloadError?.message ?? 'Unknown'}`
      );
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extractedText = await extractTextFromBuffer(buffer, resume.mimeType);

    // Step 2: Parsing with Claude
    await db
      .update(resumes)
      .set({
        processingStatus: 'parsing',
        extractedText,
      })
      .where(eq(resumes.id, resumeId));

    const parsedData = await parseResumeWithClaude(extractedText);

    // Step 3: Save parsed data & mark as parsed
    await db.transaction(async (tx) => {
      await tx
        .insert(resumeParsedData)
        .values({
          resumeId,
          userId,
          structuredData: parsedData,
          overallConfidence: String(parsedData.overallConfidence ?? 0.85),
          reviewStatus: 'pending_review',
        })
        .onConflictDoUpdate({
          target: resumeParsedData.resumeId,
          set: {
            structuredData: parsedData,
            overallConfidence: String(parsedData.overallConfidence ?? 0.85),
            reviewStatus: 'pending_review',
            updatedAt: new Date(),
          },
        });

      await tx
        .update(resumes)
        .set({
          processingStatus: 'parsed',
          parseAttempts: (resume.parseAttempts ?? 0) + 1,
        })
        .where(eq(resumes.id, resumeId));
    });

    console.log(`Successfully parsed resume ${resumeId}`);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown parsing error occurred';
    console.error(`Background parsing failed for resume ${resumeId}:`, err);

    await db
      .update(resumes)
      .set({
        processingStatus: 'failed',
        processingError: errorMessage,
      })
      .where(eq(resumes.id, resumeId));
  }
}
