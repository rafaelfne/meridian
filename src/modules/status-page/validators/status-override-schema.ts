import { z } from "zod";

export const SetStatusOverrideSchema = z.object({
  targetType: z.enum(["product", "feature"]),
  targetId: z.string().min(1, "Target is required"),
  status: z.enum(["investigating", "identified", "monitoring"]),
  message: z.string().trim().max(500).optional(),
});

export type SetStatusOverrideInput = z.infer<typeof SetStatusOverrideSchema>;

export const ResolveStatusOverrideSchema = z.object({
  overrideId: z.string().min(1, "Override ID is required"),
});

export type ResolveStatusOverrideInput = z.infer<
  typeof ResolveStatusOverrideSchema
>;
