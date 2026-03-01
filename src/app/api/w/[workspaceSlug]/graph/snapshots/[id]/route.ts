import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceAccess } from "@/lib/workspace-context";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceSlug: string; id: string }> },
) {
  const { workspaceSlug, id } = await params;

  const ctx = await verifyWorkspaceAccess(workspaceSlug);
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await prisma.graphSnapshot.findFirst({
    where: {
      id,
      upload: { workspaceId: ctx.workspaceId },
    },
    select: { nodesJson: true, edgesJson: true },
  });

  if (!snapshot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    nodes: snapshot.nodesJson,
    edges: snapshot.edgesJson,
  });
}
