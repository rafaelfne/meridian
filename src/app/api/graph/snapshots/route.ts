import { prisma } from "@/lib/prisma";

export async function GET() {
  const snapshots = await prisma.graphSnapshot.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      uploadId: true,
      systemCount: true,
      edgeCount: true,
      createdAt: true,
      upload: { select: { filename: true } },
    },
  });

  return Response.json(snapshots);
}
