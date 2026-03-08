"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";
import { ResolveStatusOverrideSchema } from "../validators/status-override-schema";
import type { ResolveStatusOverrideInput } from "../validators/status-override-schema";

export interface ResolveStatusOverrideResult {
  success: boolean;
  error?: string;
}

export async function resolveStatusOverride(
  workspaceSlug: string,
  payload: ResolveStatusOverrideInput,
): Promise<ResolveStatusOverrideResult> {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "OWNER");

  const parsed = ResolveStatusOverrideSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { overrideId } = parsed.data;

  try {
    const override = await prisma.statusOverride.findFirst({
      where: { id: overrideId, workspaceId: ctx.workspaceId },
    });

    if (!override) {
      return { success: false, error: "Override not found" };
    }

    await prisma.statusOverride.update({
      where: { id: overrideId },
      data: { status: "RESOLVED" },
    });

    revalidatePath(`/w/${workspaceSlug}/settings`);

    const config = await prisma.statusPageConfig.findUnique({
      where: { workspaceId: ctx.workspaceId },
      select: { slug: true },
    });
    if (config) {
      revalidatePath(`/status/${config.slug}`);
    }

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
