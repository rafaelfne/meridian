"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";

export async function removeMember(workspaceSlug: string, memberId: string) {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "OWNER");

  const member = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });

  if (!member || member.workspaceId !== ctx.workspaceId) {
    return { success: false as const, error: "Member not found" };
  }

  if (member.userId === ctx.userId && member.role === "OWNER") {
    return {
      success: false as const,
      error: "Cannot remove yourself as owner. Transfer ownership first.",
    };
  }

  await prisma.workspaceMember.delete({ where: { id: memberId } });

  revalidatePath(`/w/${workspaceSlug}/settings`);
  return { success: true as const };
}
