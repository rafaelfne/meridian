export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { buildGraphData } from "@/modules/graph/services/build-graph-data";
import { GraphPageClient } from "@/components/graph/GraphPageClient";

export default async function GraphPage() {
  const [systems, dependencies] = await Promise.all([
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
  ]);

  const graphData = buildGraphData(systems, dependencies);

  return (
    <GraphPageClient
      data={graphData}
      systems={systems}
      dependencies={dependencies}
    />
  );
}
