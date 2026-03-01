import { verifyWorkspaceAccess } from "@/lib/workspace-context";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ workspaceSlug: string; slug: string }>;
  },
) {
  const { workspaceSlug, slug: systemSlug } = await params;
  const ctx = await verifyWorkspaceAccess(workspaceSlug);
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const docSlug = request.nextUrl.searchParams.get("slug");
  if (!docSlug) {
    return NextResponse.json({ available: false, error: "Missing slug" });
  }

  const system = await prisma.system.findFirst({
    where: { slug: systemSlug, domain: { workspaceId: ctx.workspaceId } },
    select: { id: true },
  });
  if (!system) {
    return NextResponse.json({ available: false, error: "System not found" });
  }

  const existing = await prisma.document.findUnique({
    where: {
      systemId_slug: { systemId: system.id, slug: docSlug },
    },
    select: { id: true },
  });

  return NextResponse.json({ available: !existing });
}
