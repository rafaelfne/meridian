export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { SettingsPageClient } from "@/components/workspace/SettingsPageClient";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const ctx = await requireWorkspaceAccess(workspaceSlug, "EDITOR");

  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: ctx.workspaceId },
    select: { id: true, name: true, slug: true, description: true },
  });

  const members =
    ctx.role === "OWNER"
      ? await prisma.workspaceMember.findMany({
          where: { workspaceId: ctx.workspaceId },
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { createdAt: "asc" },
        })
      : [];

  return (
    <SettingsPageClient
      workspace={workspace}
      members={members.map((m) => ({
        id: m.id,
        role: m.role,
        user: m.user,
      }))}
      currentUserId={ctx.userId}
      userRole={ctx.role}
      workspaceSlug={workspaceSlug}
    />
  );
}
