"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";
import { SetStatusOverrideSchema } from "../validators/status-override-schema";
import type { SetStatusOverrideInput } from "../validators/status-override-schema";
import type { OverrideStatus } from "@/generated/prisma/enums";

export interface SetStatusOverrideResult {
  success: boolean;
  error?: string;
}

const STATUS_MAP = {
  investigating: "INVESTIGATING",
  identified: "IDENTIFIED",
  monitoring: "MONITORING",
} as const satisfies Record<string, OverrideStatus>;

export async function setStatusOverride(
  workspaceSlug: string,
  payload: SetStatusOverrideInput,
): Promise<SetStatusOverrideResult> {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "OWNER");

  const parsed = SetStatusOverrideSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { targetType, targetId, status, message } = parsed.data;

  try {
    // Verify target exists in this workspace
    if (targetType === "product") {
      const product = await prisma.product.findFirst({
        where: { id: targetId, workspaceId: ctx.workspaceId },
      });
      if (!product) return { success: false, error: "Product not found" };
    } else {
      const feature = await prisma.feature.findFirst({
        where: {
          id: targetId,
          product: { workspaceId: ctx.workspaceId },
        },
      });
      if (!feature) return { success: false, error: "Feature not found" };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Check for existing active override on same target
    const existing = await prisma.statusOverride.findFirst({
      where: {
        workspaceId: ctx.workspaceId,
        targetType,
        targetId,
        status: { not: "RESOLVED" },
        expiresAt: { gt: now },
      },
    });

    if (existing) {
      await prisma.statusOverride.update({
        where: { id: existing.id },
        data: {
          status: STATUS_MAP[status],
          message: message || null,
          setBy: ctx.userId,
          expiresAt,
        },
      });
    } else {
      await prisma.statusOverride.create({
        data: {
          workspaceId: ctx.workspaceId,
          targetType,
          targetId,
          status: STATUS_MAP[status],
          message: message || null,
          setBy: ctx.userId,
          expiresAt,
        },
      });
    }

    revalidatePath(`/w/${workspaceSlug}/settings`);

    // Revalidate public status page if it exists
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
