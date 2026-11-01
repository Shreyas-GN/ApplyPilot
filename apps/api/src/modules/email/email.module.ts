import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EMAIL_PROVIDER } from "./email.provider.interface";
import { ConsoleEmailProvider } from "./providers/console-email.provider";
import { SmtpEmailProvider } from "./providers/smtp-email.provider";
import { EmailService } from "./email.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EMAIL_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>("EMAIL_PROVIDER") === "smtp"
          ? new SmtpEmailProvider(config)
          : new ConsoleEmailProvider(),
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
