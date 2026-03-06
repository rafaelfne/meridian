import { z } from "zod";

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase alphanumeric with hyphens",
    ),
  description: z.string().max(500).optional(),
});

export const InviteMemberSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(["EDITOR", "VIEWER"]),
});

export const UpdateMemberRoleSchema = z.object({
  memberId: z.string().cuid(),
  role: z.enum(["EDITOR", "VIEWER"]),
});

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});
