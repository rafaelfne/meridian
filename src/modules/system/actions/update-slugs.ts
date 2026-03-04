"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";
import { processDependenciesAction } from "@/modules/graph/actions/process";

const slugPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

const UpdateSlugsSchema = z.object({
  systemSlugs: z.array(
    z.object({
      id: z.string(),
      slug: z
        .string()
        .min(1, "Slug cannot be empty")
        .max(100)
        .regex(slugPattern, "Slug must be lowercase alphanumeric with hyphens"),
    }),
  ),
  serviceSlugs: z.array(
    z.object({
      id: z.string(),
      slug: z
        .string()
        .min(1, "Slug cannot be empty")
        .max(100)
        .regex(slugPattern, "Slug must be lowercase alphanumeric with hyphens"),
    }),
  ),
});

export interface UpdateSlugsResult {
  success: boolean;
  error?: string;
}

export async function updateSlugsAction(
  workspaceSlug: string,
  payload: { systemSlugs: { id: string; slug: string }[]; serviceSlugs: { id: string; slug: string }[] },
): Promise<UpdateSlugsResult> {
  await requireWorkspaceAccess(workspaceSlug, "EDITOR");

  const parsed = UpdateSlugsSchema.safeParse(payload);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message ?? "Invalid payload" };
  }

  const { systemSlugs, serviceSlugs } = parsed.data;

  if (systemSlugs.length === 0 && serviceSlugs.length === 0) {
    return { success: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const { id, slug } of systemSlugs) {
        await tx.system.update({ where: { id }, data: { slug } });
      }
      for (const { id, slug } of serviceSlugs) {
        await tx.service.update({ where: { id }, data: { slug } });
      }
    });

    await processDependenciesAction();

    revalidatePath(`/w/${workspaceSlug}/systems`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unique constraint")) {
      return {
        success: false,
        error: "A slug must be unique. One of the slugs you entered already exists.",
      };
    }
    return { success: false, error: message };
  }
}
