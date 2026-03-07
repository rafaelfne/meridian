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
  serviceDatadogTags: z.array(
    z.object({
      id: z.string(),
      datadogServiceTag: z.string().max(200),
    }),
  ).optional().default([]),
  systemDomains: z.array(
    z.object({
      id: z.string(),
      domainId: z.string(),
    }),
  ).optional().default([]),
});

export interface UpdateSlugsResult {
  success: boolean;
  error?: string;
}

export async function updateSlugsAction(
  workspaceSlug: string,
  payload: {
    systemSlugs: { id: string; slug: string }[];
    serviceSlugs: { id: string; slug: string }[];
    serviceDatadogTags?: { id: string; datadogServiceTag: string }[];
    systemDomains?: { id: string; domainId: string }[];
  },
): Promise<UpdateSlugsResult> {
  await requireWorkspaceAccess(workspaceSlug, "EDITOR");

  const parsed = UpdateSlugsSchema.safeParse(payload);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message ?? "Invalid payload" };
  }

  const { systemSlugs, serviceSlugs, serviceDatadogTags, systemDomains } = parsed.data;

  if (systemSlugs.length === 0 && serviceSlugs.length === 0 && serviceDatadogTags.length === 0 && systemDomains.length === 0) {
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
      for (const { id, datadogServiceTag } of serviceDatadogTags) {
        await tx.service.update({
          where: { id },
          data: { datadogServiceTag: datadogServiceTag || null },
        });
      }
      for (const { id, domainId } of systemDomains) {
        await tx.system.update({ where: { id }, data: { domainId } });
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
