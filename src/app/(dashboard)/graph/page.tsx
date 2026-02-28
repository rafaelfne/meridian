export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { buildGraphData } from "@/modules/graph/services/build-graph-data";
import { GraphPageClient } from "@/components/graph/GraphPageClient";

export default async function GraphPage() {
  const [systems, dependencies, snapshots] = await Promise.all([
    prisma.system.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        language: true,
        framework: true,
        layer: true,
        domain: { select: { name: true } },
        _count: { select: { services: true, risks: true } },
      },
    }),
    prisma.dependency.findMany({
      select: {
        id: true,
        sourceId: true,
        targetId: true,
        type: true,
        label: true,
      },
    }),
    prisma.graphSnapshot.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        uploadId: true,
        systemCount: true,
        edgeCount: true,
        createdAt: true,
        upload: { select: { filename: true } },
      },
    }),
  ]);

  const graphData = buildGraphData(systems, dependencies);

  // Serialize dates for client component
  const serializedSnapshots = snapshots.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <GraphPageClient
      data={graphData}
      systems={systems}
      dependencies={dependencies}
      snapshots={serializedSnapshots}
    />
  );
}
