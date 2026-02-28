import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    inventoryUpload: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";

const mockFindMany = prisma.inventoryUpload.findMany as ReturnType<
  typeof vi.fn
>;
const mockCount = prisma.inventoryUpload.count as ReturnType<typeof vi.fn>;

describe("GET /api/inventories/uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated uploads with defaults", async () => {
    const mockUploads = [
      {
        id: "u1",
        filename: "inventory.json",
        status: "COMPLETED",
        systemsCount: 5,
        createdAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
      },
    ];
    mockFindMany.mockResolvedValue(mockUploads);
    mockCount.mockResolvedValue(1);

    const request = new NextRequest(
      "http://localhost/api/inventories/uploads"
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(mockUploads);
    expect(body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("handles custom pagination", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(75);

    const request = new NextRequest(
      "http://localhost/api/inventories/uploads?page=2&limit=25"
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 25,
        take: 25,
      })
    );
    expect(body.pagination).toEqual({
      page: 2,
      limit: 25,
      total: 75,
      totalPages: 3,
    });
  });

  it("returns 400 for invalid query parameters", async () => {
    const request = new NextRequest(
      "http://localhost/api/inventories/uploads?page=abc"
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid query parameters");
    expect(body.details).toBeDefined();
  });

  it("returns 400 for limit exceeding max", async () => {
    const request = new NextRequest(
      "http://localhost/api/inventories/uploads?limit=200"
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });
});
