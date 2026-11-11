import { z } from "zod";

export const jobStateSchema = z.object({
  state: z.enum(["saved", "dismissed"]),
});

export type JobStateInput = z.infer<typeof jobStateSchema>;

