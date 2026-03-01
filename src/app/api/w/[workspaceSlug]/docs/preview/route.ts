import { verifyWorkspaceAccess } from "@/lib/workspace-context";
import { renderMarkdocSource } from "@/modules/docs/services/render-markdoc";
import Markdoc from "@markdoc/markdoc";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const { workspaceSlug } = await params;
  const ctx = await verifyWorkspaceAccess(workspaceSlug);
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = (await request.json()) as { source?: string };
  const source = body.source ?? "";

  const { content, headings, errors } = renderMarkdocSource(source);

  // Render to HTML string for the editor preview
  const html = Markdoc.renderers.html(content);

  return NextResponse.json({ html, headings, errors });
}
