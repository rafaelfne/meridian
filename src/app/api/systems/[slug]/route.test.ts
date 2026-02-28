import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    system: {
      findUnique: vi.fn(),
    },
  },
}));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";

const mockFindUnique = prisma.system.findUnique as ReturnType<typeof vi.fn>;

describe("GET /api/systems/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a system by slug", async () => {
    const mockSystem = {
      id: "1",
      name: "Auth Service",
      slug: "auth-service",
      domain: { id: "d1", name: "Identity" },
    };
    mockFindUnique.mockResolvedValue(mockSystem);

    const request = new NextRequest(
      "http://localhost/api/systems/auth-service"
    );
    const response = await GET(request, {
      params: Promise.resolve({ slug: "auth-service" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(mockSystem);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { slug: "auth-service" },
      include: {
        domain: { select: { id: true, name: true } },
      },
    });
  });

  it("returns 404 when system not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost/api/systems/nonexistent"
    );
    const response = await GET(request, {
      params: Promise.resolve({ slug: "nonexistent" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("System not found");
  });

  it("includes requested relations", async () => {
    const mockSystem = {
      id: "1",
      name: "Auth Service",
      slug: "auth-service",
      domain: { id: "d1", name: "Identity" },
      services: [{ id: "s1", name: "auth-api" }],
      databases: [{ id: "db1", name: "auth-db" }],
    };
    mockFindUnique.mockResolvedValue(mockSystem);

    const request = new NextRequest(
      "http://localhost/api/systems/auth-service?include=services,databases"
    );
    const response = await GET(request, {
      params: Promise.resolve({ slug: "auth-service" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(mockSystem);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { slug: "auth-service" },
      include: {
        domain: { select: { id: true, name: true } },
        services: true,
        databases: true,
      },
    });
  });

  it("ignores invalid include values", async () => {
    const mockSystem = {
      id: "1",
      name: "Auth Service",
      slug: "auth-service",
      domain: { id: "d1", name: "Identity" },
    };
    mockFindUnique.mockResolvedValue(mockSystem);

    const request = new NextRequest(
      "http://localhost/api/systems/auth-service?include=invalid,services"
    );
    const response = await GET(request, {
      params: Promise.resolve({ slug: "auth-service" }),
    });

    expect(response.status).toBe(200);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { slug: "auth-service" },
      include: {
        domain: { select: { id: true, name: true } },
        services: true,
      },
    });
  });

  it("includes integrations when requested", async () => {
    const mockSystem = {
      id: "1",
      name: "Payment Service",
      slug: "payment-service",
      domain: { id: "d1", name: "Payments" },
      integrations: [{ id: "i1", name: "stripe-api" }],
    };
    mockFindUnique.mockResolvedValue(mockSystem);

    const request = new NextRequest(
      "http://localhost/api/systems/payment-service?include=integrations"
    );
    const response = await GET(request, {
      params: Promise.resolve({ slug: "payment-service" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.integrations).toEqual([{ id: "i1", name: "stripe-api" }]);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { slug: "payment-service" },
      include: {
        domain: { select: { id: true, name: true } },
        integrations: true,
      },
    });
  });
});
