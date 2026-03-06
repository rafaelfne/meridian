import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/workspace-context", () => ({
  requireWorkspaceAccess: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    domain: { create: vi.fn() },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createDomainAction } from "./create-domain";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { prisma } from "@/lib/prisma";

const mockRequireAccess = requireWorkspaceAccess as ReturnType<typeof vi.fn>;
const mockCreate = prisma.domain.create as ReturnType<typeof vi.fn>;

describe("createDomainAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccess.mockResolvedValue({
      workspaceId: "ws-1",
      userId: "user-1",
      role: "EDITOR",
    });
  });

  it("returns error for empty domain name", async () => {
    const result = await createDomainAction("my-workspace", "");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/cannot be empty/i);
  });

  it("returns error for whitespace-only name", async () => {
    const result = await createDomainAction("my-workspace", "   ");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/cannot be empty/i);
  });

  it("creates a domain and returns it", async () => {
    mockCreate.mockResolvedValue({ id: "domain-1", name: "Payments" });

    const result = await createDomainAction("my-workspace", "Payments");

    expect(result.success).toBe(true);
    expect(result.domain).toEqual({ id: "domain-1", name: "Payments" });
    expect(mockCreate).toHaveBeenCalledWith({
      data: { name: "Payments", workspaceId: "ws-1" },
      select: { id: true, name: true },
    });
  });

  it("trims whitespace from domain name before saving", async () => {
    mockCreate.mockResolvedValue({ id: "domain-1", name: "Payments" });

    await createDomainAction("my-workspace", "  Payments  ");

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: "Payments" }),
      select: { id: true, name: true },
    });
  });

  it("returns error on unique constraint violation", async () => {
    mockCreate.mockRejectedValue(new Error("Unique constraint failed"));

    const result = await createDomainAction("my-workspace", "Payments");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already exists/i);
  });

  it("returns generic error message for unexpected failures", async () => {
    mockCreate.mockRejectedValue(new Error("DB connection failed"));

    const result = await createDomainAction("my-workspace", "Payments");

    expect(result.success).toBe(false);
    expect(result.error).toBe("DB connection failed");
  });

  it("requires EDITOR access", async () => {
    mockCreate.mockResolvedValue({ id: "domain-1", name: "X" });

    await createDomainAction("my-workspace", "X");

    expect(mockRequireAccess).toHaveBeenCalledWith("my-workspace", "EDITOR");
  });
});
