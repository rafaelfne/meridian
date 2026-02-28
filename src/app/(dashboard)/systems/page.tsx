export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { SystemListItem } from "@/modules/system/types";
import { SystemsTable } from "@/components/systems/SystemsTable";

export default async function SystemsPage() {
  const [systems, domains] = await Promise.all([
    prisma.system.findMany({
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
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="container mx-auto max-w-7xl space-y-8 py-8 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Systems</h1>
          <p className="text-muted-foreground">
            Browse and search all registered systems
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </div>

      <SystemsTable systems={systems} domains={domains} />
    </div>
  );
}
