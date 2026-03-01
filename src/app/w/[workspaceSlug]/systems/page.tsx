export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import type { SystemListItem } from "@/modules/system/types";
import { SystemsTable } from "@/components/systems/SystemsTable";

export default async function SystemsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const ctx = await requireWorkspaceAccess(workspaceSlug);

  const [systems, domains] = await Promise.all([
    prisma.system.findMany({
      where: { domain: { workspaceId: ctx.workspaceId } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        language: true,
        framework: true,
        domain: { select: { id: true, name: true } },
        _count: {
          select: {
            services: true,
            databases: true,
            integrations: true,
          },
        },
      },
    }) as Promise<SystemListItem[]>,
    prisma.domain.findMany({
      where: { workspaceId: ctx.workspaceId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="container mx-auto max-w-7xl space-y-8 py-8 px-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Systems</h1>
        <p className="text-muted-foreground">
          Browse and search all registered systems
        </p>
      </div>

      <SystemsTable systems={systems} domains={domains} />
    </div>
  );
}
