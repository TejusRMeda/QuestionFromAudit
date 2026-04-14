import { z } from "zod";

const optionChangeSchema = z.object({
  text: z.string(),
  characteristic: z.string(),
  comment: z.string().optional(),
});

const modifiedOptionSchema = z.object({
  index: z.number().int().nonnegative(),
  from: z.string(),
  to: z.string(),
  fromCharacteristic: z.string().optional(),
  toCharacteristic: z.string().optional(),
  comment: z.string().optional(),
});

const settingsChangesSchema = z.object({
  required: z.object({ from: z.boolean(), to: z.boolean() }).optional(),
  deleteQuestion: z.object({ to: z.union([z.boolean(), z.literal("true"), z.literal("false")]) }).optional(),
});

const contentChangesSchema = z.object({
  questionText: z.object({ from: z.string(), to: z.string() }).optional(),
  answerType: z.object({ from: z.string(), to: z.string() }).optional(),
  options: z
    .object({
      added: z.array(optionChangeSchema),
      modified: z.array(modifiedOptionSchema),
      removed: z.array(z.number().int().nonnegative()),
    })
    .optional(),
});

const helpChangesSchema = z.object({
  hasHelper: z.object({ from: z.boolean(), to: z.boolean() }).optional(),
  helperName: z.object({ from: z.string().nullable(), to: z.string() }).optional(),
  helperValue: z.object({ from: z.string().nullable(), to: z.string() }).optional(),
  helperType: z.object({ from: z.string().nullable(), to: z.string() }).optional(),
});

const logicChangesSchema = z.object({
  description: z.string(),
});

const newQuestionDataSchema = z.object({
  position: z.enum(["before", "after"]),
  questionText: z.string().min(1),
});

export const componentChangesSchema = z.object({
  settings: settingsChangesSchema.optional(),
  content: contentChangesSchema.optional(),
  help: helpChangesSchema.optional(),
  logic: logicChangesSchema.optional(),
  newQuestion: newQuestionDataSchema.optional(),
});
