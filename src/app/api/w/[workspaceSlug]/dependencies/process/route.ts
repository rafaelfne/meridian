import { NextRequest, NextResponse } from "next/server";
import { verifyWorkspaceAccess } from "@/lib/workspace-context";
import { processDependenciesAction } from "@/modules/graph/actions/process";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const { workspaceSlug } = await params;
  const ctx = await verifyWorkspaceAccess(workspaceSlug, "EDITOR");
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const result = await processDependenciesAction();

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}
