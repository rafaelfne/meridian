import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceAccess } from "@/lib/workspace-context";
import { GraphQuerySchema } from "@/modules/graph/validators/graph-query-schema";
import { buildGraphData } from "@/modules/graph/services/build-graph-data";
import type { DependencyType } from "@/generated/prisma/enums";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const { workspaceSlug } = await params;
  const ctx = await verifyWorkspaceAccess(workspaceSlug);
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = GraphQuerySchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { domain, dependencyType } = parsed.data;

  try {
    const systemWhere = {
      domain: {
        workspaceId: ctx.workspaceId,
        ...(domain ? { name: domain } : {}),
      },
    };

    const dependencyWhere = {
      source: { domain: { workspaceId: ctx.workspaceId } },
      ...(dependencyType?.length
        ? { type: { in: dependencyType as DependencyType[] } }
        : {}),
    };

    const [systems, dependencies] = await Promise.all([
      prisma.system.findMany({
        where: systemWhere,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          language: true,
          framework: true,
          domain: { select: { name: true } },
          _count: { select: { services: true, risks: true } },
          services: { select: { slug: true, name: true, type: true } },
        },
      }),
      prisma.dependency.findMany({
        where: dependencyWhere,
        select: {
          id: true,
          sourceId: true,
          targetId: true,
          type: true,
          label: true,
          metadata: true,
        },
      }),
    ]);

    const graphData = buildGraphData(systems, dependencies);

    return NextResponse.json({ data: graphData });
  } catch (error) {
    console.error("Failed to build graph data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
