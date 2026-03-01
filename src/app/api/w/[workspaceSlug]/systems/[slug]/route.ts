import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceAccess } from "@/lib/workspace-context";
import { SystemDetailQuerySchema } from "@/modules/inventory/validators/query-schemas";

const VALID_INCLUDES = ["services", "databases", "integrations"] as const;
type ValidInclude = (typeof VALID_INCLUDES)[number];

function parseIncludes(includeParam?: string): Record<string, boolean> {
  if (!includeParam) return {};
  const requested = includeParam.split(",").map((s) => s.trim());
  const includes: Record<string, boolean> = {};
  for (const inc of requested) {
    if (VALID_INCLUDES.includes(inc as ValidInclude)) {
      includes[inc] = true;
    }
  }
  return includes;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string; slug: string }> },
) {
  const { workspaceSlug, slug } = await params;
  const ctx = await verifyWorkspaceAccess(workspaceSlug);
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = SystemDetailQuerySchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const includes = parseIncludes(parsed.data.include);

  const system = await prisma.system.findUnique({
    where: { slug },
    include: {
      domain: { select: { id: true, name: true, workspaceId: true } },
      ...includes,
    },
  });

  if (!system || system.domain.workspaceId !== ctx.workspaceId) {
    return NextResponse.json({ error: "System not found" }, { status: 404 });
  }

  return NextResponse.json({ data: system });
}
