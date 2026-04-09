import { z } from "zod";

export const CreateMasterSchema = z.object({
  name: z.string().trim().min(1, "Questionnaire name is required").max(200),
  questions: z.array(z.object({}).passthrough()).min(1, "At least one question is required").max(500, "Maximum 500 questions"),
});
