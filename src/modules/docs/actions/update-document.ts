"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";
import { UpdateDocumentSchema } from "../validators/document-schema";

export async function updateDocument(
  workspaceSlug: string,
  systemSlug: string,
  documentSlug: string,
  formData: FormData,
) {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "EDITOR");

  const parsed = UpdateDocumentSchema.safeParse({
    title: formData.get("title") || undefined,
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const doc = await prisma.document.findFirst({
    where: {
      slug: documentSlug,
      system: {
        slug: systemSlug,
        domain: { workspaceId: ctx.workspaceId },
      },
    },
  });
  if (!doc) {
    return { success: false as const, error: "Document not found" };
  }

  await prisma.$transaction([
    // Save revision before overwriting
    prisma.documentRevision.create({
      data: {
        content: doc.content,
        documentId: doc.id,
        authorId: ctx.userId,
      },
    }),
    // Update document
    prisma.document.update({
      where: { id: doc.id },
      data: {
        ...(parsed.data.title && { title: parsed.data.title }),
        content: parsed.data.content,
      },
    }),
  ]);

  revalidatePath(
    `/w/${workspaceSlug}/systems/${systemSlug}/docs/${documentSlug}`,
  );
  revalidatePath(`/w/${workspaceSlug}/systems/${systemSlug}`);
  return { success: true as const };
}
