import { z } from "zod";

export const CreateMasterSchema = z.object({
  name: z.string().trim().min(1, "Questionnaire name is required").max(200),
  questions: z.array(z.object({}).passthrough()).min(1, "At least one question is required").max(500, "Maximum 500 questions"),
});

export const UpdateMasterQuestionSchema = z.object({
  questionText: z.string().trim().max(1000).optional(),
  answerType: z.string().trim().optional(),
  answerOptions: z.string().trim().max(5000).nullable().optional(),
  isHidden: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  required: z.boolean().optional(),
  hasHelper: z.boolean().optional(),
  helperType: z.string().max(200).nullable().optional(),
  helperName: z.string().max(200).nullable().optional(),
  helperValue: z.string().max(5000).nullable().optional(),
}).refine(data => Object.keys(data).length > 0, { message: "At least one field must be provided" });
