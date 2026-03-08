import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const StatusPageFeatureSchema = z.object({
  featureId: z.string().min(1),
  publicName: z.string().trim().min(1, "Public name is required").max(200),
  visible: z.boolean(),
});

const StatusPageProductSchema = z.object({
  productId: z.string().min(1),
  publicName: z.string().trim().min(1, "Public name is required").max(200),
  visible: z.boolean(),
  features: z.array(StatusPageFeatureSchema),
});

export const SaveStatusPageConfigSchema = z.object({
  enabled: z.boolean(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(slugPattern, "Slug must be lowercase alphanumeric with hyphens"),
  items: z.array(StatusPageProductSchema),
});

export type SaveStatusPageConfigInput = z.infer<
  typeof SaveStatusPageConfigSchema
>;
