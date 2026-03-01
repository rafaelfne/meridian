import { z } from "zod/v4";

export const CreateDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase alphanumeric with hyphens",
    ),
  content: z.string().default(""),
});

export const UpdateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string(),
});
