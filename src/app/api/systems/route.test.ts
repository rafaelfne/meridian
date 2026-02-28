import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    system: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";

const mockFindMany = prisma.system.findMany as ReturnType<typeof vi.fn>;
const mockCount = prisma.system.count as ReturnType<typeof vi.fn>;

describe("GET /api/systems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated systems with defaults", async () => {
    const mockSystems = [
      {
        id: "1",
        name: "Auth Service",
        slug: "auth-service",
        domain: { id: "d1", name: "Identity" },
        _count: { services: 2, databases: 1, integrations: 3 },
      },
    ];
    mockFindMany.mockResolvedValue(mockSystems);
    mockCount.mockResolvedValue(1);

    const request = new NextRequest("http://localhost/api/systems");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(mockSystems);
    expect(body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { name: "asc" },
      })
    );
  });

  it("filters by domain when provided", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const request = new NextRequest(
      "http://localhost/api/systems?domain=Payments"
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { domain: { name: "Payments" } },
      })
    );
    expect(body.pagination.total).toBe(0);
  });

  it("calculates skip correctly for pagination", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(50);

    const request = new NextRequest(
      "http://localhost/api/systems?page=3&limit=10"
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      })
    );
    expect(body.pagination).toEqual({
      page: 3,
      limit: 10,
      total: 50,
      totalPages: 5,
    });
  });

  it("returns 400 for invalid query parameters", async () => {
    const request = new NextRequest(
      "http://localhost/api/systems?page=abc"
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid query parameters");
    expect(body.details).toBeDefined();
  });

  it("returns 400 for limit exceeding max", async () => {
    const request = new NextRequest(
      "http://localhost/api/systems?limit=101"
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });
});
