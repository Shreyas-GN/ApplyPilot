import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

// Makes JwtAuthGuard injectable from any feature module (profile, resumes,
// ...) without each one separately importing JwtModule. AuthModule still
// owns its own JwtModule import for signing tokens; this is only for
// verifying them on protected routes.
@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard],
})
export class CommonAuthModule {}
