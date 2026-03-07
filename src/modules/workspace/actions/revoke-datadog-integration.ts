"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";

export async function revokeDatadogIntegration(workspaceSlug: string) {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "OWNER");

  await prisma.datadogIntegration.update({
    where: { workspaceId: ctx.workspaceId },
    data: {
      apiKey: "",
      appKey: "",
      status: "REVOKED",
      revokedAt: new Date(),
    },
  });

  revalidatePath(`/w/${workspaceSlug}/settings`);
  return { success: true as const };
}
