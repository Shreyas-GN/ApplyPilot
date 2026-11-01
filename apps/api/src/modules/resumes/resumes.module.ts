import { Module } from "@nestjs/common";
import { CommonAuthModule } from "../../common/common-auth.module";
import { ProfileModule } from "../profile/profile.module";
import { ResumesController } from "./resumes.controller";
import { ResumesService } from "./resumes.service";
import { ResumeParsingQueueService } from "./resume-parsing-queue.service";

@Module({
  imports: [CommonAuthModule, ProfileModule],
  controllers: [ResumesController],
  providers: [ResumesService, ResumeParsingQueueService],
  exports: [ResumesService],
})
export class ResumesModule {}
