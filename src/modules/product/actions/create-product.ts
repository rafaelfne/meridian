"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";
import { CreateProductSchema } from "../validators/product-schema";

export interface CreateProductResult {
  success: boolean;
  product?: { id: string; slug: string };
  error?: string;
}

export async function createProductAction(
  workspaceSlug: string,
  payload: {
    name: string;
    slug: string;
    description?: string;
    tier?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    systemIds?: string[];
  },
): Promise<CreateProductResult> {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "EDITOR");

  const parsed = CreateProductSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { name, slug, description, tier, systemIds } = parsed.data;

  try {
    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name,
          slug,
          description,
          tier,
          workspaceId: ctx.workspaceId,
        },
        select: { id: true, slug: true },
      });

      if (systemIds.length > 0) {
        await tx.productSystem.createMany({
          data: systemIds.map((systemId) => ({
            productId: p.id,
            systemId,
          })),
        });
      }

      return p;
    });

    revalidatePath(`/w/${workspaceSlug}/products`);
    return { success: true, product };
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
