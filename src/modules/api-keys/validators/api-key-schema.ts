import { z } from "zod";

export const API_KEY_EXPIRY_OPTIONS = [
  "never",
  "30d",
  "90d",
  "1y",
] as const;

export type ApiKeyExpiry = (typeof API_KEY_EXPIRY_OPTIONS)[number];

export const CreateApiKeySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  expires: z.enum(API_KEY_EXPIRY_OPTIONS),
});

export const RevokeApiKeySchema = z.object({
  keyId: z.string().cuid(),
});
