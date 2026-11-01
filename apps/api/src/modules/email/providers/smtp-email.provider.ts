import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, type Transporter } from "nodemailer";
import type { EmailProvider, SendEmailInput } from "../email.provider.interface";

// Works with any SMTP provider (Mailtrap for dev inboxes, SES SMTP,
// Postmark, a self-hosted relay, ...) — selected via EMAIL_PROVIDER=smtp.
// See .env.example for the required SMTP_* variables.
@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.transporter = createTransport({
      host: config.getOrThrow<string>("SMTP_HOST"),
      port: config.getOrThrow<number>("SMTP_PORT"),
      secure: config.get<boolean>("SMTP_SECURE") ?? false,
      auth: config.get("SMTP_USER")
        ? { user: config.get<string>("SMTP_USER"), pass: config.get<string>("SMTP_PASSWORD") }
        : undefined,
    });
    this.from = config.getOrThrow<string>("SMTP_FROM");
  }

  async send(input: SendEmailInput): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  }
}
