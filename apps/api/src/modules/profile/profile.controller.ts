import { Body, Controller, Get, Patch, Put, UseGuards } from "@nestjs/common";
import type { ProfileDto } from "@applypilot/shared";
import {
  replaceCertificationsSchema,
  replaceEducationSchema,
  replaceProjectsSchema,
  replaceSkillsSchema,
  replaceWorkExperienceSchema,
  updatePreferencesSchema,
  updateProfileSchema,
  type ReplaceCertificationsInput,
  type ReplaceEducationInput,
  type ReplaceProjectsInput,
  type ReplaceSkillsInput,
  type ReplaceWorkExperienceInput,
  type UpdatePreferencesInput,
  type UpdateProfileInput,
} from "@applypilot/validators";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { ProfileService } from "./profile.service";

// Note: the Zod pipes below are attached to the @Body() parameter itself
// (`@Body(new ZodValidationPipe(schema))`), not via a method-level
// `@UsePipes()`. A method-level pipe runs over *every* parameter — including
// `@CurrentUser()` — which would silently reparse the authenticated user
// object against the body schema too.
@Controller("profile")
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@CurrentUser() user: AuthenticatedUser): Promise<ProfileDto> {
    return this.profileService.getProfile(user.id);
  }

  @Patch()
  async updateBasicInfo(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ): Promise<ProfileDto> {
    return this.profileService.updateBasicInfo(user.id, body);
  }

  @Put("experience")
  async replaceExperience(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(replaceWorkExperienceSchema)) body: ReplaceWorkExperienceInput,
  ): Promise<ProfileDto> {
    return this.profileService.replaceExperience(user.id, body);
  }

  @Put("education")
  async replaceEducation(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(replaceEducationSchema)) body: ReplaceEducationInput,
  ): Promise<ProfileDto> {
    return this.profileService.replaceEducation(user.id, body);
  }

  @Put("skills")
  async replaceSkills(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(replaceSkillsSchema)) body: ReplaceSkillsInput,
  ): Promise<ProfileDto> {
    return this.profileService.replaceSkills(user.id, body);
  }

  @Put("projects")
  async replaceProjects(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(replaceProjectsSchema)) body: ReplaceProjectsInput,
  ): Promise<ProfileDto> {
    return this.profileService.replaceProjects(user.id, body);
  }

  @Put("certifications")
  async replaceCertifications(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(replaceCertificationsSchema)) body: ReplaceCertificationsInput,
  ): Promise<ProfileDto> {
    return this.profileService.replaceCertifications(user.id, body);
  }

  @Put("preferences")
  async updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updatePreferencesSchema)) body: UpdatePreferencesInput,
  ): Promise<ProfileDto> {
    return this.profileService.updatePreferences(user.id, body);
  }
}
