import { z } from "zod";

export const CreateFeatureSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().max(500).optional(),
  systemIds: z.array(z.string()).optional().default([]),
});

export const UpdateFeatureSchema = CreateFeatureSchema;

export type CreateFeatureInput = z.infer<typeof CreateFeatureSchema>;
export type UpdateFeatureInput = z.infer<typeof UpdateFeatureSchema>;
