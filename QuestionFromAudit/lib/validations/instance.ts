import { z } from "zod";

export const CreateInstanceSchema = z.object({
  trustName: z.string().trim().min(1, "Trust name is required").max(200),
});

export const CreateSectionReviewSchema = z.object({
  sectionName: z.string().trim().min(1, "Section name is required"),
  reviewerName: z.string().trim().min(1, "Reviewer name is required"),
  hasSuggestions: z.boolean().optional().default(false),
});
