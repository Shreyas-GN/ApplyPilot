import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { parseNodeEnv } from "@applypilot/validators";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { RedisModule } from "./modules/redis/redis.module";
import { EmailModule } from "./modules/email/email.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ProfileModule } from "./modules/profile/profile.module";
import { StorageModule } from "./modules/storage/storage.module";
import { ResumesModule } from "./modules/resumes/resumes.module";
import { CommonAuthModule } from "./common/common-auth.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { NoopThrottlerGuard } from "./common/guards/noop-throttler.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => parseNodeEnv(config),
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
    }),
    PrismaModule,
    RedisModule,
    EmailModule,
    AuditModule,
    CommonAuthModule,
    AuthModule,
    ProfileModule,
    StorageModule,
    ResumesModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: process.env.NODE_ENV === "test" ? NoopThrottlerGuard : ThrottlerGuard,
    },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
