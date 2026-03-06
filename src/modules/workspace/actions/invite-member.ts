"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";
import { InviteMemberSchema } from "../validators/workspace-schema";

export async function inviteMember(workspaceSlug: string, formData: FormData) {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "OWNER");

  const parsed = InviteMemberSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
  });
  if (!targetUser) {
    return {
      success: false as const,
      error: { userId: ["User not found."] },
    };
  }

  const existingMember = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: targetUser.id,
        workspaceId: ctx.workspaceId,
      },
    },
  });
  if (existingMember) {
    return {
      success: false as const,
      error: { userId: ["User is already a member of this workspace."] },
    };
  }

  await prisma.workspaceMember.create({
    data: {
      userId: targetUser.id,
      workspaceId: ctx.workspaceId,
      role: parsed.data.role,
    },
  });

  revalidatePath(`/w/${workspaceSlug}/settings`);
  return { success: true as const };
}
