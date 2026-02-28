import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const snapshot = await prisma.graphSnapshot.findUnique({
    where: { id },
    select: { nodesJson: true, edgesJson: true },
  });

  if (!snapshot) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json({
    nodes: snapshot.nodesJson,
    edges: snapshot.edgesJson,
  });
}
