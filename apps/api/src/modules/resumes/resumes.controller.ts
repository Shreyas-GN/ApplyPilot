import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { ResumeDto, ResumeParsedDataDto } from "@applypilot/shared";
import {
  RESUME_MAX_FILE_SIZE_BYTES,
  resumeParsedDataSchema,
  type ResumeParsedData,
} from "@applypilot/validators";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { ResumesService } from "./resumes.service";

@Controller("resumes")
@UseGuards(JwtAuthGuard)
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: RESUME_MAX_FILE_SIZE_BYTES } }))
  @HttpCode(HttpStatus.CREATED)
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body("versionLabel") versionLabel: string | undefined,
  ): Promise<ResumeDto> {
    if (!file) {
      throw new BadRequestException("No file was uploaded.");
    }
    return this.resumesService.upload(user.id, file, versionLabel);
  }

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser): Promise<ResumeDto[]> {
    return this.resumesService.list(user.id);
  }

  @Get(":id")
  async get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<ResumeDto> {
    return this.resumesService.get(user.id, id);
  }

  @Get(":id/status")
  async getStatus(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.resumesService.getStatus(user.id, id);
  }

  @Get(":id/parsed-data")
  async getParsedData(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ): Promise<ResumeParsedDataDto> {
    return this.resumesService.getParsedData(user.id, id);
  }

  @Patch(":id/parsed-data")
  async updateParsedData(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(resumeParsedDataSchema)) body: ResumeParsedData,
  ): Promise<ResumeParsedDataDto> {
    return this.resumesService.updateParsedData(user.id, id, body);
  }

  @Post(":id/confirm")
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirm(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this.resumesService.confirm(user.id, id);
  }

  @Patch(":id/primary")
  async setPrimary(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ): Promise<ResumeDto> {
    return this.resumesService.setPrimary(user.id, id);
  }

  @Get(":id/download-url")
  async getDownloadUrl(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.resumesService.getDownloadUrl(user.id, id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this.resumesService.delete(user.id, id);
  }
}
