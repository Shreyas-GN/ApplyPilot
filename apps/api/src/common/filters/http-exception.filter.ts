import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Request, Response } from "express";

// Centralized exception handling: every error response, whatever module
// threw it, comes out the same problem+json-ish shape (docs/API_DESIGN.md
// §11) and never leaks an internal error message or stack trace to the
// client — those go to the server log only.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;

    const detail =
      status < HttpStatus.INTERNAL_SERVER_ERROR
        ? extractDetail(exceptionResponse)
        : "An unexpected error occurred.";

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      type: `https://httpstatuses.com/${status}`,
      title: HttpStatus[status] ?? "Error",
      status,
      detail,
      instance: request.url,
    });
  }
}

function extractDetail(body: unknown): string {
  if (typeof body === "string") return body;
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) return message.join("; ");
    if (typeof message === "string") return message;
  }
  return "Request could not be processed.";
}
