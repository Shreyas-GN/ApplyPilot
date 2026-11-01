import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

// For request bodies already modeled as Zod schemas in packages/validators
// (shared with the frontend and, for resume data, with apps/workers) —
// avoids hand-duplicating the same nested-array shape as class-validator
// DTOs. Plain class-validator DTOs are still used for simple flat bodies
// (see modules/auth/dto).
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(
        result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      );
    }
    return result.data;
  }
}
