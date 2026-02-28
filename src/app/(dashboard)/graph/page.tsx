export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { buildGraphData } from "@/modules/graph/services/build-graph-data";
import { DependencyGraph } from "@/components/graph/DependencyGraph";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <div className="container mx-auto max-w-7xl space-y-8 py-8 px-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Dependency Graph
        </h1>
        <p className="text-muted-foreground">
          Visualize how your systems are connected through their dependencies.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Dependencies</CardTitle>
          <CardDescription>
            Interactive graph showing all systems and their dependency
            relationships. Drag nodes to rearrange, scroll to zoom.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DependencyGraph data={graphData} />
        </CardContent>
      </Card>
    </div>
  );
}
