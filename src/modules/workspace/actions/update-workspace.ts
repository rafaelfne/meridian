"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";
import { UpdateWorkspaceSchema } from "../validators/workspace-schema";

export async function updateWorkspace(
  workspaceSlug: string,
  formData: FormData,
) {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "EDITOR");

  const parsed = UpdateWorkspaceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.workspace.update({
    where: { id: ctx.workspaceId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    },
  });

  revalidatePath(`/w/${workspaceSlug}/settings`);
  revalidatePath("/workspaces");
  return { success: true as const };
}
