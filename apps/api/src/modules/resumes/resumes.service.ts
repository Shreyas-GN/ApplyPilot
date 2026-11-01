import { createHash, randomUUID } from "node:crypto";
import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { ResumeDto, ResumeParsedDataDto } from "@applypilot/shared";
import { resumeParsedDataSchema, type ResumeParsedData } from "@applypilot/validators";
import {
  RESUME_ALLOWED_MIME_TYPES,
  RESUME_MAX_FILE_SIZE_BYTES,
  hasAllowedResumeExtension,
} from "@applypilot/validators";
import { AuditAction } from "@applypilot/shared";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { ProfileService } from "../profile/profile.service";
import { STORAGE_PROVIDER, type StorageProvider } from "../storage/storage.provider.interface";
import { ResumeParsingQueueService } from "./resume-parsing-queue.service";
import { mimeTypeMatchesSniffedType, sniffFileType } from "./file-signature.util";

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const DOWNLOAD_URL_TTL_SECONDS = 300;

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    private readonly queue: ResumeParsingQueueService,
    private readonly auditService: AuditService,
    private readonly profileService: ProfileService,
  ) {}

  async upload(userId: string, file: UploadedFile, versionLabel?: string): Promise<ResumeDto> {
    this.validateUpload(file);

    const checksum = createHash("sha256").update(file.buffer).digest("hex");
    const storageKey = `resumes/${userId}/${randomUUID()}-${sanitizeFilename(file.originalname)}`;

    await this.storage.putObject({
      key: storageKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    const existingCount = await this.prisma.resume.count({ where: { userId } });

    const resume = await this.prisma.$transaction(async (tx) => {
      const created = await tx.resume.create({
        data: {
          userId,
          versionLabel: versionLabel?.trim() || file.originalname,
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          fileSizeBytes: file.size,
          storageKey,
          checksum,
          isPrimary: existingCount === 0,
          processingStatus: "uploaded",
        },
      });
      await tx.resumeParsingJob.create({
        data: { resumeId: created.id, status: "queued" },
      });
      return created;
    });

    await this.queue.enqueue(resume.id);
    await this.auditService.record(userId, AuditAction.RESUME_UPLOADED, {
      resumeId: resume.id,
    });

    return this.toDto(resume.id, userId);
  }

  async list(userId: string): Promise<ResumeDto[]> {
    const resumes = await this.prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { parsingJob: true, parsedData: true },
    });
    return resumes.map(mapResumeToDto);
  }

  async get(userId: string, resumeId: string): Promise<ResumeDto> {
    const resume = await this.findOwned(userId, resumeId, { parsingJob: true, parsedData: true });
    return mapResumeToDto(resume);
  }

  async getStatus(
    userId: string,
    resumeId: string,
  ): Promise<{ processingStatus: string; parsingJobStatus: string | null; error: string | null }> {
    const resume = await this.findOwned(userId, resumeId, { parsingJob: true });
    return {
      processingStatus: resume.processingStatus,
      parsingJobStatus: resume.parsingJob?.status ?? null,
      error: resume.processingError ?? resume.parsingJob?.error ?? null,
    };
  }

  async getParsedData(userId: string, resumeId: string): Promise<ResumeParsedDataDto> {
    const resume = await this.findOwned(userId, resumeId, { parsedData: true });
    if (!resume.parsedData) {
      throw new NotFoundException("This resume has not finished parsing yet.");
    }
    return resume.parsedData.structuredData as unknown as ResumeParsedDataDto;
  }

  async updateParsedData(
    userId: string,
    resumeId: string,
    corrected: ResumeParsedData,
  ): Promise<ResumeParsedDataDto> {
    const resume = await this.findOwned(userId, resumeId, { parsedData: true });
    if (!resume.parsedData) {
      throw new NotFoundException("This resume has not finished parsing yet.");
    }
    if (resume.parsedData.reviewStatus === "confirmed") {
      throw new BadRequestException(
        "This resume's parsed data has already been confirmed and applied to your profile.",
      );
    }

    const updated = await this.prisma.resumeParsedData.update({
      where: { resumeId },
      data: { structuredData: corrected },
    });
    return updated.structuredData as unknown as ResumeParsedDataDto;
  }

  async confirm(userId: string, resumeId: string): Promise<void> {
    const resume = await this.findOwned(userId, resumeId, { parsedData: true });
    if (!resume.parsedData) {
      throw new NotFoundException("This resume has not finished parsing yet.");
    }
    if (resume.parsedData.reviewStatus === "confirmed") {
      return; // idempotent
    }

    const parsed = resumeParsedDataSchema.parse(resume.parsedData.structuredData);
    await this.profileService.applyParsedResumeData(userId, parsed);

    await this.prisma.resumeParsedData.update({
      where: { resumeId },
      data: { reviewStatus: "confirmed", confirmedAt: new Date() },
    });
    await this.auditService.record(userId, AuditAction.RESUME_CONFIRMED, { resumeId });
  }

  async setPrimary(userId: string, resumeId: string): Promise<ResumeDto> {
    await this.findOwned(userId, resumeId, {});
    await this.prisma.$transaction([
      this.prisma.resume.updateMany({ where: { userId }, data: { isPrimary: false } }),
      this.prisma.resume.update({ where: { id: resumeId }, data: { isPrimary: true } }),
    ]);
    return this.toDto(resumeId, userId);
  }

  async delete(userId: string, resumeId: string): Promise<void> {
    const resume = await this.findOwned(userId, resumeId, {});
    await this.prisma.resume.delete({ where: { id: resumeId } });
    await this.storage.deleteObject(resume.storageKey);
    await this.auditService.record(userId, AuditAction.RESUME_DELETED, { resumeId });
  }

  async getDownloadUrl(userId: string, resumeId: string): Promise<{ url: string; expiresInSeconds: number }> {
    const resume = await this.findOwned(userId, resumeId, {});
    const url = await this.storage.getSignedDownloadUrl(resume.storageKey, DOWNLOAD_URL_TTL_SECONDS);
    return { url, expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS };
  }

  private async toDto(resumeId: string, userId: string): Promise<ResumeDto> {
    return this.get(userId, resumeId);
  }

  private async findOwned(
    userId: string,
    resumeId: string,
    include: { parsingJob?: boolean; parsedData?: boolean },
  ) {
    const resume = await this.prisma.resume.findUnique({ where: { id: resumeId }, include });
    if (!resume) {
      throw new NotFoundException("Resume not found.");
    }
    // 404, not 403: existence of another user's resume is not confirmed
    // either way. See docs/PRODUCT_REQUIREMENTS.md principle on user-level
    // data isolation.
    if (resume.userId !== userId) {
      throw new NotFoundException("Resume not found.");
    }
    return resume;
  }

  private validateUpload(file: UploadedFile): void {
    if (file.size > RESUME_MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File is too large (max ${RESUME_MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB).`,
      );
    }
    if (!hasAllowedResumeExtension(file.originalname)) {
      throw new BadRequestException("Only .pdf and .docx files are supported.");
    }
    if (!(RESUME_ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      throw new BadRequestException("Only PDF and DOCX files are supported.");
    }
    const sniffed = sniffFileType(file.buffer);
    if (sniffed === "unknown" || !mimeTypeMatchesSniffedType(file.mimetype, sniffed)) {
      throw new BadRequestException(
        "This file doesn't look like a valid PDF or DOCX file. It may be corrupted or mislabeled.",
      );
    }
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-150);
}

function mapResumeToDto(resume: {
  id: string;
  versionLabel: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  isPrimary: boolean;
  processingStatus: string;
  processingError: string | null;
  createdAt: Date;
  parsingJob?: { status: string } | null;
  parsedData?: { reviewStatus: string } | null;
}): ResumeDto {
  return {
    id: resume.id,
    versionLabel: resume.versionLabel,
    originalFilename: resume.originalFilename,
    mimeType: resume.mimeType,
    fileSizeBytes: resume.fileSizeBytes,
    isPrimary: resume.isPrimary,
    processingStatus: resume.processingStatus,
    processingError: resume.processingError,
    parsingJobStatus: resume.parsingJob?.status ?? null,
    reviewStatus: resume.parsedData?.reviewStatus ?? null,
    createdAt: resume.createdAt.toISOString(),
  };
}
