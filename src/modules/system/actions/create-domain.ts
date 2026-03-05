"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";

const CreateDomainSchema = z.object({
  name: z.string().trim().min(1, "Domain name cannot be empty").max(100),
});

export interface CreateDomainResult {
  success: boolean;
  domain?: { id: string; name: string };
  error?: string;
}

export async function createDomainAction(
  workspaceSlug: string,
  name: string,
): Promise<CreateDomainResult> {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "EDITOR");

  const parsed = CreateDomainSchema.safeParse({ name });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid name" };
  }

  try {
    const domain = await prisma.domain.create({
      data: {
        name: parsed.data.name,
        workspaceId: ctx.workspaceId,
      },
      select: { id: true, name: true },
    });

    revalidatePath(`/w/${workspaceSlug}/systems`);

    return { success: true, domain };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unique constraint")) {
      return { success: false, error: "A domain with this name already exists" };
    }
    return { success: false, error: message };
  }
}
