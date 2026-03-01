"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";
import { CreateDocumentSchema } from "../validators/document-schema";

export async function createDocument(
  workspaceSlug: string,
  systemSlug: string,
  formData: FormData,
) {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "EDITOR");

  const parsed = CreateDocumentSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    content: formData.get("content") ?? "",
  });
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  // Verify system belongs to this workspace
  const system = await prisma.system.findFirst({
    where: { slug: systemSlug, domain: { workspaceId: ctx.workspaceId } },
  });
  if (!system) {
    return { success: false as const, error: "System not found" };
  }

  // Check slug uniqueness within system
  const existing = await prisma.document.findUnique({
    where: {
      systemId_slug: { systemId: system.id, slug: parsed.data.slug },
    },
  });
  if (existing) {
    return {
      success: false as const,
      error: {
        slug: ["Document slug already exists for this system"],
      },
    };
  }

  const doc = await prisma.document.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      content: parsed.data.content,
      systemId: system.id,
      authorId: ctx.userId,
    },
  });

  revalidatePath(`/w/${workspaceSlug}/systems/${systemSlug}`);
  return { success: true as const, data: { id: doc.id, slug: doc.slug } };
}
