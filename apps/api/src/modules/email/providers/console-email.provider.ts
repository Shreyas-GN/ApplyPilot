import { Injectable, Logger } from "@nestjs/common";
import type { EmailProvider, SendEmailInput } from "../email.provider.interface";

// Local-development / test default: no credentials required. Writes the
// email to the application log instead of sending it, so verification and
// password-reset links are still reachable (copy them out of the logs)
// without needing a real mail provider configured.
@Injectable()
export class ConsoleEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  async send(input: SendEmailInput): Promise<void> {
    this.logger.log(
      `[dev email] to=${input.to} subject="${input.subject}"\n${input.text}`,
    );
  }
}
