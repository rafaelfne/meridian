"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";
import { UpdateProductSchema } from "../validators/product-schema";

export interface UpdateProductResult {
  success: boolean;
  error?: string;
}

export async function updateProductAction(
  workspaceSlug: string,
  productId: string,
  payload: {
    name: string;
    slug: string;
    description?: string;
    tier: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    systemIds?: string[];
  },
): Promise<UpdateProductResult> {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "EDITOR");

  const parsed = UpdateProductSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { name, slug, description, tier, systemIds } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // Verify the product belongs to this workspace
      const existing = await tx.product.findFirst({
        where: { id: productId, workspaceId: ctx.workspaceId },
      });
      if (!existing) {
        throw new Error("Product not found");
      }

      await tx.product.update({
        where: { id: productId },
        data: { name, slug, description, tier },
      });

      // Replace system links
      await tx.productSystem.deleteMany({
        where: { productId },
      });

      if (systemIds.length > 0) {
        await tx.productSystem.createMany({
          data: systemIds.map((systemId) => ({
            productId,
            systemId,
          })),
        });
      }
    });

    revalidatePath(`/w/${workspaceSlug}/products`);
    revalidatePath(`/w/${workspaceSlug}/products/${payload.slug}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unique constraint")) {
      return {
        success: false,
        error: "A product with this name or slug already exists",
      };
    }
    return { success: false, error: message };
  }
}
