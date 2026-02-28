import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const domains = await prisma.domain.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { systems: true },
      },
    },
  });

  return NextResponse.json({ data: domains });
}
