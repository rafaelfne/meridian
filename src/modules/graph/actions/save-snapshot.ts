"use server";

import { prisma } from "@/lib/prisma";
import { buildGraphData } from "../services/build-graph-data";

export async function saveGraphSnapshot(uploadId: string): Promise<void> {
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

  await prisma.graphSnapshot.upsert({
    where: { uploadId },
    create: {
      uploadId,
      nodesJson: graphData.nodes as unknown as object[],
      edgesJson: graphData.edges as unknown as object[],
      systemCount: graphData.nodes.length,
      edgeCount: graphData.edges.length,
    },
    update: {
      nodesJson: graphData.nodes as unknown as object[],
      edgesJson: graphData.edges as unknown as object[],
      systemCount: graphData.nodes.length,
      edgeCount: graphData.edges.length,
    },
  });
}
