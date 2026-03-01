import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceAccess } from "@/lib/workspace-context";
import { UploadsQuerySchema } from "@/modules/inventory/validators/query-schemas";

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
  const parsed = UploadsQuerySchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where = { workspaceId: ctx.workspaceId };

  const [uploads, total] = await Promise.all([
    prisma.inventoryUpload.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        filename: true,
        status: true,
        systemsCount: true,
        createdAt: true,
        processedAt: true,
      },
    }),
    prisma.inventoryUpload.count({ where }),
  ]);

  return NextResponse.json({
    data: uploads,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
