"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";

export async function revokeDatadogIntegration(workspaceSlug: string) {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "OWNER");

  await prisma.$transaction(async (tx) => {
    await tx.datadogIntegration.update({
      where: { workspaceId: ctx.workspaceId },
      data: {
        apiKey: "",
        appKey: "",
        status: "REVOKED",
        revokedAt: new Date(),
      },
    });

    const systemIds = await tx.system.findMany({
      where: { domain: { workspaceId: ctx.workspaceId } },
      select: { id: true },
    });

    if (systemIds.length > 0) {
      const ids = systemIds.map((s) => s.id);

      await tx.service.updateMany({
        where: { systemId: { in: ids } },
        data: {
          datadogStatus: null,
          datadogStatusUpdatedAt: null,
          datadogMonitorIds: undefined,
        },
      });

      await tx.system.updateMany({
        where: { id: { in: ids } },
        data: { datadogStatus: null },
      });
    }
  });

  revalidatePath(`/w/${workspaceSlug}/settings`);
  return { success: true as const };
}
