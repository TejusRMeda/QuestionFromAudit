import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CreateCommentSchema = z.object({
  authorName: z.string().trim().min(1, "Author name is required").max(100),
  authorEmail: z
    .string()
    .regex(emailRegex, "Invalid email address")
    .nullish()
    .transform((v) => v || null),
  message: z.string().trim().min(1, "Message is required").max(2000),
  isTestSession: z.boolean().optional().default(false),
});
