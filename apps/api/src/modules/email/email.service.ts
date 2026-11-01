import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EMAIL_PROVIDER, type EmailProvider } from "./email.provider.interface";

@Injectable()
export class EmailService {
  constructor(
    @Inject(EMAIL_PROVIDER) private readonly provider: EmailProvider,
    private readonly config: ConfigService,
  ) {}

  async sendEmailVerification(to: string, token: string): Promise<void> {
    const link = `${this.config.get<string>("APP_URL")}/verify-email?token=${encodeURIComponent(token)}`;
    await this.provider.send({
      to,
      subject: "Verify your ApplyPilot email",
      text: `Confirm your email address by visiting: ${link}\n\nThis link expires in 24 hours. If you didn't create an ApplyPilot account, you can ignore this email.`,
    });
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const link = `${this.config.get<string>("APP_URL")}/reset-password?token=${encodeURIComponent(token)}`;
    await this.provider.send({
      to,
      subject: "Reset your ApplyPilot password",
      text: `Reset your password by visiting: ${link}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email — your password hasn't been changed.`,
    });
  }
}
