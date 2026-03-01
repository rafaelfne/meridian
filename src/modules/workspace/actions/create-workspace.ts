"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CreateWorkspaceSchema } from "../validators/workspace-schema";

export async function createWorkspace(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
  };

  const parsed = CreateWorkspaceSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.workspace.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return { success: false as const, error: { slug: ["This slug is already taken"] } };
  }

  const workspace = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({ data: parsed.data });
    await tx.workspaceMember.create({
      data: {
        userId: session.user.id,
        workspaceId: ws.id,
        role: "OWNER",
      },
    });
    return ws;
  });

  revalidatePath("/workspaces");
  return { success: true as const, data: { id: workspace.id, slug: workspace.slug } };
}
