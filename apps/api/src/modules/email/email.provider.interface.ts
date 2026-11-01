export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Provider interface so the actual transport is swappable via EMAIL_PROVIDER
// without touching call sites. See .env.example for the full variable list.
export interface EmailProvider {
  send(input: SendEmailInput): Promise<void>;
}

export const EMAIL_PROVIDER = "EMAIL_PROVIDER";
