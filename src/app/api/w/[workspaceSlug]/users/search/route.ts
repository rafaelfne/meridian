import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceAccess } from "@/lib/workspace-context";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const { workspaceSlug } = await params;
  const ctx = await verifyWorkspaceAccess(workspaceSlug, "OWNER");
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const existingMemberIds = await prisma.workspaceMember.findMany({
    where: { workspaceId: ctx.workspaceId },
    select: { userId: true },
  });
  const excludeIds = existingMemberIds.map((m) => m.userId);

  const users = await prisma.user.findMany({
    where: {
      id: { notIn: excludeIds },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true, image: true },
    take: 10,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}
