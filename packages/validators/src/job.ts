import { z } from "zod";

export const jobStateSchema = z.object({
  state: z.enum(["saved", "dismissed"]),
});

export type JobStateInput = z.infer<typeof jobStateSchema>;

export const screeningQuestionSchema = z.object({
  question: z.string().trim().min(3, "Enter a screening question").max(1500),
  jobId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  company: z.string().trim().max(200).optional(),
  jobTitle: z.string().trim().max(200).optional(),
  jobDescription: z.string().trim().max(20000).optional(),
});

export type ScreeningQuestionPayload = z.infer<typeof screeningQuestionSchema>;

