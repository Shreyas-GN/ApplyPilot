import { Worker, type Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { resumeParsedDataSchema } from "@applypilot/validators";
import { createQueueConnection } from "../redis";
import { readStorageObject, type StorageReaderEnv } from "../storage-reader";
import { extractResumeText, UnsupportedOrCorruptFileError } from "../text-extraction";

function readStorageEnv(): StorageReaderEnv {
  return {
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER ?? "local",
    LOCAL_STORAGE_DIR: process.env.LOCAL_STORAGE_DIR ?? "../../.local-storage",
    S3_BUCKET: process.env.S3_BUCKET,
    S3_REGION: process.env.S3_REGION,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE === "true",
  };
}

export const RESUME_PARSING_QUEUE_NAME = "resume-parsing";

export interface ResumeParsingJobData {
  resumeId: string;
}

const prisma = new PrismaClient();

export function createResumeParsingWorker(): Worker<ResumeParsingJobData> {
  return new Worker<ResumeParsingJobData>(
    RESUME_PARSING_QUEUE_NAME,
    (job: Job<ResumeParsingJobData>) => processResumeParsingJob(job.data.resumeId),
    { connection: createQueueConnection(), concurrency: 2 },
  );
}

async function processResumeParsingJob(resumeId: string): Promise<void> {
  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume) {
    // The resume was deleted after the job was enqueued (e.g. the user
    // deleted it before it got picked up) — nothing to do, not an error.
    return;
  }

  await markJobProcessing(resumeId);

  let extractedText: string;
  try {
    await prisma.resume.update({
      where: { id: resumeId },
      data: { processingStatus: "extracting" },
    });
    const bytes = await readStorageObject(resume.storageKey, readStorageEnv());
    extractedText = await extractResumeText(bytes, resume.mimeType);

    if (!extractedText.trim()) {
      throw new UnsupportedOrCorruptFileError(
        "No readable text was found in this file — it may be a scanned image without a text layer.",
      );
    }

    await prisma.resume.update({
      where: { id: resumeId },
      data: { processingStatus: "extracted", extractedText },
    });
  } catch (error) {
    await failResume(resumeId, (error as Error).message);
    return;
  }

  try {
    await prisma.resume.update({ where: { id: resumeId }, data: { processingStatus: "parsing" } });

    const aiServiceUrl = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
    const response = await fetch(`${aiServiceUrl}/parse-resume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: extractedText }),
    });

    if (!response.ok) {
      throw new Error(`AI service responded with ${response.status}`);
    }

    const raw = await response.json();
    const parsed = resumeParsedDataSchema.parse(raw); // never trust the wire — validate strictly

    await prisma.$transaction([
      prisma.resumeParsedData.upsert({
        where: { resumeId },
        create: {
          resumeId,
          structuredData: parsed,
          overallConfidence: parsed.overallConfidence ?? null,
          reviewStatus: "pending_review",
        },
        update: {
          structuredData: parsed,
          overallConfidence: parsed.overallConfidence ?? null,
        },
      }),
      prisma.resume.update({ where: { id: resumeId }, data: { processingStatus: "parsed" } }),
      prisma.resumeParsingJob.update({
        where: { resumeId },
        data: { status: "completed", completedAt: new Date() },
      }),
    ]);
  } catch (error) {
    await failResume(resumeId, `AI parsing failed: ${(error as Error).message}`);
  }
}

async function markJobProcessing(resumeId: string): Promise<void> {
  await prisma.resumeParsingJob.update({
    where: { resumeId },
    data: { status: "processing", startedAt: new Date(), attempts: { increment: 1 } },
  });
}

async function failResume(resumeId: string, message: string): Promise<void> {
  await prisma.$transaction([
    prisma.resume.update({
      where: { id: resumeId },
      data: { processingStatus: "failed", processingError: message },
    }),
    prisma.resumeParsingJob.update({
      where: { resumeId },
      data: { status: "failed", error: message },
    }),
  ]);
}
