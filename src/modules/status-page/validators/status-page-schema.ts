import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hexColorPattern = /^#[0-9a-fA-F]{6}$/;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB as base64

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

const WhiteLabelSchema = z.object({
  logoUrl: z.string().max(MAX_IMAGE_BYTES).nullable(),
  faviconUrl: z.string().max(MAX_IMAGE_BYTES).nullable(),
  primaryColor: z
    .string()
    .regex(hexColorPattern, "Must be a valid hex color")
    .nullable()
    .or(z.literal("")),
  pageTitle: z.string().max(200).nullable().or(z.literal("")),
  hidePoweredBy: z.boolean(),
});

export const SaveStatusPageConfigSchema = z.object({
  enabled: z.boolean(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(slugPattern, "Slug must be lowercase alphanumeric with hyphens"),
  items: z.array(StatusPageProductSchema),
  whiteLabel: WhiteLabelSchema,
});

export type SaveStatusPageConfigInput = z.infer<
  typeof SaveStatusPageConfigSchema
>;
