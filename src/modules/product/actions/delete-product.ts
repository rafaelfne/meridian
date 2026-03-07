"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";

export interface DeleteProductResult {
  success: boolean;
  error?: string;
}

export async function deleteProductAction(
  workspaceSlug: string,
  productId: string,
): Promise<DeleteProductResult> {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "EDITOR");

  try {
    const existing = await prisma.product.findFirst({
      where: { id: productId, workspaceId: ctx.workspaceId },
    });
    if (!existing) {
      return { success: false, error: "Product not found" };
    }

    await prisma.product.delete({ where: { id: productId } });

    revalidatePath(`/w/${workspaceSlug}/products`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete product",
    };
  }
}
