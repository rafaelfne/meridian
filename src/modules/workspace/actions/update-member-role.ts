"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";
import { UpdateMemberRoleSchema } from "../validators/workspace-schema";

export async function updateMemberRole(
  workspaceSlug: string,
  formData: FormData,
) {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "OWNER");

  const parsed = UpdateMemberRoleSchema.safeParse({
    memberId: formData.get("memberId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const member = await prisma.workspaceMember.findUnique({
    where: { id: parsed.data.memberId },
  });

  if (!member || member.workspaceId !== ctx.workspaceId) {
    return { success: false as const, error: "Member not found" };
  }

  if (member.role === "OWNER") {
    return { success: false as const, error: "Cannot change role of an owner" };
  }

  await prisma.workspaceMember.update({
    where: { id: parsed.data.memberId },
    data: { role: parsed.data.role },
  });

  revalidatePath(`/w/${workspaceSlug}/settings`);
  return { success: true as const };
}
