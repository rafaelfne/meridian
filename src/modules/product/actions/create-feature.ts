"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";
import { CreateFeatureSchema } from "../validators/feature-schema";

export interface CreateFeatureResult {
  success: boolean;
  feature?: { id: string; name: string };
  error?: string;
}

export async function createFeatureAction(
  workspaceSlug: string,
  productId: string,
  payload: {
    name: string;
    description?: string;
    systemIds?: string[];
  },
): Promise<CreateFeatureResult> {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "EDITOR");

  const parsed = CreateFeatureSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { name, description, systemIds } = parsed.data;

  try {
    // Verify product belongs to workspace
    const product = await prisma.product.findFirst({
      where: { id: productId, workspaceId: ctx.workspaceId },
      select: { id: true, slug: true },
    });
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const feature = await prisma.$transaction(async (tx) => {
      const f = await tx.feature.create({
        data: {
          name,
          description,
          productId,
        },
        select: { id: true, name: true },
      });

      if (systemIds.length > 0) {
        await tx.featureSystem.createMany({
          data: systemIds.map((systemId) => ({
            featureId: f.id,
            systemId,
          })),
        });
      }

      return f;
    });

    revalidatePath(`/w/${workspaceSlug}/products/${product.slug}`);
    return { success: true, feature };
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
