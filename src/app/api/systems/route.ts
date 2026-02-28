import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SystemsQuerySchema } from "@/modules/inventory/validators/query-schemas";

export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = SystemsQuerySchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { domain, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where = domain ? { domain: { name: domain } } : {};

  const [systems, total] = await Promise.all([
    prisma.system.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: {
        domain: { select: { id: true, name: true } },
        _count: {
          select: {
            services: true,
            databases: true,
            integrations: true,
          },
        },
      },
    }),
    prisma.system.count({ where }),
  ]);

  return NextResponse.json({
    data: systems,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
