export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import type { SystemListItemWithServices } from "@/modules/system/types";
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
        services: {
          select: { id: true, name: true, slug: true, type: true, datadogServiceTag: true },
          orderBy: { name: "asc" },
        },
        _count: {
          select: {
            services: true,
            databases: true,
            integrations: true,
            documents: true,
          },
        },
      },
    }) as Promise<SystemListItemWithServices[]>,
    prisma.domain.findMany({
      where: { workspaceId: ctx.workspaceId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <SystemsTable systems={systems} domains={domains} workspaceSlug={workspaceSlug} />
    </div>
  );
}
