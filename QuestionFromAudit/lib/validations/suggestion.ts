import { z } from "zod";
import { componentChangesSchema } from "./componentChanges";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CreateSuggestionSchema = z.object({
  instanceQuestionId: z.number().int().positive("instanceQuestionId is required"),
  submitterName: z.string().trim().min(1, "Submitter name is required").max(100),
  submitterEmail: z
    .string()
    .regex(emailRegex, "Invalid email address")
    .nullish()
    .transform((v) => v || null),
  suggestionText: z.string().trim().min(1, "Suggestion text is required").max(2000),
  reason: z.string().trim().min(1, "Reason is required").max(1000),
  componentChanges: componentChangesSchema.nullish(),
  isTestSession: z.boolean().optional().default(false),
});

export const UpdateSuggestionSchema = z
  .object({
    status: z.enum(["pending", "approved", "rejected"]).optional(),
    responseMessage: z.string().max(1000).nullish(),
    internalComment: z.string().max(2000).nullish(),
  })
  .refine((data) => data.status || data.responseMessage !== undefined || data.internalComment !== undefined, {
    message: "At least one field must be provided",
  });

/** Legacy suggestion creation — uses questionId instead of instanceQuestionId */
export const CreateLegacySuggestionSchema = z.object({
  questionId: z.number().int().positive("questionId is required"),
  submitterName: z.string().trim().min(1, "Submitter name is required").max(100),
  submitterEmail: z
    .string()
    .regex(emailRegex, "Invalid email address")
    .nullish()
    .transform((v) => v || null),
  suggestionText: z.string().trim().min(1, "Suggestion text is required").max(2000),
  reason: z.string().trim().min(1, "Reason is required").max(1000),
  componentChanges: componentChangesSchema.nullish(),
});
