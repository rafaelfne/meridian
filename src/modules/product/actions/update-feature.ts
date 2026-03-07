"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";
import { UpdateFeatureSchema } from "../validators/feature-schema";

export interface UpdateFeatureResult {
  success: boolean;
  error?: string;
}

export async function updateFeatureAction(
  workspaceSlug: string,
  featureId: string,
  payload: {
    name: string;
    description?: string;
    systemIds?: string[];
  },
): Promise<UpdateFeatureResult> {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "EDITOR");

  const parsed = UpdateFeatureSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { name, description, systemIds } = parsed.data;

  try {
    // Verify feature belongs to workspace via product
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

    await prisma.$transaction(async (tx) => {
      await tx.feature.update({
        where: { id: featureId },
        data: { name, description },
      });

      // Replace system links
      await tx.featureSystem.deleteMany({
        where: { featureId },
      });

      if (systemIds.length > 0) {
        await tx.featureSystem.createMany({
          data: systemIds.map((systemId) => ({
            featureId,
            systemId,
          })),
        });
      }
    });

    revalidatePath(`/w/${workspaceSlug}/products/${feature.product.slug}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unique constraint")) {
      return {
        success: false,
        error: "A feature with this name already exists in this product",
      };
    }
    return { success: false, error: message };
  }
}
