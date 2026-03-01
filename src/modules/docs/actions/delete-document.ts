"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";

export async function deleteDocument(
  workspaceSlug: string,
  systemSlug: string,
  documentSlug: string,
) {
  await requireWorkspaceAccess(workspaceSlug, "OWNER");

  const doc = await prisma.document.findFirst({
    where: {
      slug: documentSlug,
      system: {
        slug: systemSlug,
        domain: {
          workspace: { slug: workspaceSlug },
        },
      },
    },
  });
  if (!doc) {
    return { success: false as const, error: "Document not found" };
  }

  await prisma.document.delete({ where: { id: doc.id } });

  revalidatePath(`/w/${workspaceSlug}/systems/${systemSlug}`);
  return { success: true as const };
}
