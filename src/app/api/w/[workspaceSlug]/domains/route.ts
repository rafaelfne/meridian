import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceAccess } from "@/lib/workspace-context";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const { workspaceSlug } = await params;
  const ctx = await verifyWorkspaceAccess(workspaceSlug);
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const domains = await prisma.domain.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { systems: true },
      },
    },
  });

  return NextResponse.json({ data: domains });
}
