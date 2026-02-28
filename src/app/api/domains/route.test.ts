import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    domain: {
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";

const mockFindMany = prisma.domain.findMany as ReturnType<typeof vi.fn>;

describe("GET /api/domains", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all domains with system counts", async () => {
    const mockDomains = [
      {
        id: "d1",
        name: "Identity",
        description: "Auth systems",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { systems: 3 },
      },
      {
        id: "d2",
        name: "Payments",
        description: "Payment processing",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { systems: 5 },
      },
    ];
    mockFindMany.mockResolvedValue(mockDomains);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(mockDomains);
    expect(body.data).toHaveLength(2);
    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { systems: true },
        },
      },
    });
  });

  it("returns empty array when no domains exist", async () => {
    mockFindMany.mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });
});
