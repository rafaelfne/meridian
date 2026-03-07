import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const CreateProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(slugPattern, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(500).optional(),
  tier: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  systemIds: z.array(z.string()).optional().default([]),
});

export const UpdateProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(slugPattern, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(500).optional(),
  tier: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  systemIds: z.array(z.string()).optional().default([]),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
