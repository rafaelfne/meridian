"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";

export interface DeleteFeatureResult {
  success: boolean;
  error?: string;
}

export async function deleteFeatureAction(
  workspaceSlug: string,
  featureId: string,
): Promise<DeleteFeatureResult> {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "EDITOR");

  try {
    const feature = await prisma.feature.findFirst({
      where: {
        id: featureId,
        product: { workspaceId: ctx.workspaceId },
      },
      select: { id: true, product: { select: { slug: true } } },
    });
    if (!feature) {
      return { success: false, error: "Feature not found" };
    }

    await prisma.feature.delete({ where: { id: featureId } });

    revalidatePath(`/w/${workspaceSlug}/products/${feature.product.slug}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete feature",
    };
  }
}
