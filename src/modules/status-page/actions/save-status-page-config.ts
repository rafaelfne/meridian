"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";
import { SaveStatusPageConfigSchema } from "../validators/status-page-schema";
import type { SaveStatusPageConfigInput } from "../validators/status-page-schema";

export interface SaveStatusPageConfigResult {
  success: boolean;
  error?: string;
}

export async function saveStatusPageConfig(
  workspaceSlug: string,
  payload: SaveStatusPageConfigInput,
): Promise<SaveStatusPageConfigResult> {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "OWNER");

  const parsed = SaveStatusPageConfigSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { enabled, slug, items } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const existingSlug = await tx.statusPageConfig.findUnique({
        where: { slug },
        select: { workspaceId: true },
      });
      if (existingSlug && existingSlug.workspaceId !== ctx.workspaceId) {
        throw new Error("This slug is already taken");
      }

      const config = await tx.statusPageConfig.upsert({
        where: { workspaceId: ctx.workspaceId },
        create: {
          workspaceId: ctx.workspaceId,
          enabled,
          slug,
        },
        update: {
          enabled,
          slug,
        },
      });

      await tx.statusPageFeature.deleteMany({
        where: { statusPageProduct: { statusPageId: config.id } },
      });
      await tx.statusPageProduct.deleteMany({
        where: { statusPageId: config.id },
      });

      for (let i = 0; i < items.length; i++) {
        const item = items[i]!;
        const spProduct = await tx.statusPageProduct.create({
          data: {
            statusPageId: config.id,
            productId: item.productId,
            publicName: item.publicName,
            visible: item.visible,
            displayOrder: i,
          },
        });

        if (item.features.length > 0) {
          await tx.statusPageFeature.createMany({
            data: item.features.map((f, j) => ({
              statusPageProductId: spProduct.id,
              featureId: f.featureId,
              publicName: f.publicName,
              visible: f.visible,
              displayOrder: j,
            })),
          });
        }
      }
    });

    revalidatePath(`/w/${workspaceSlug}/settings`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
