import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/workspace-context", () => ({
  requireWorkspaceAccess: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceMember: { findUnique: vi.fn(), delete: vi.fn() },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { removeMember } from "./remove-member";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { prisma } from "@/lib/prisma";

const mockRequireAccess = requireWorkspaceAccess as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.workspaceMember.findUnique as ReturnType<typeof vi.fn>;
const mockDelete = prisma.workspaceMember.delete as ReturnType<typeof vi.fn>;

describe("removeMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccess.mockResolvedValue({
      workspaceId: "ws-1",
      userId: "owner-1",
      role: "OWNER",
    });
  });

  it("returns error when member is not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await removeMember("my-workspace", "member-1");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  it("returns error when member belongs to a different workspace", async () => {
    mockFindUnique.mockResolvedValue({
      id: "member-1",
      workspaceId: "ws-other",
      userId: "user-2",
      role: "EDITOR",
    });

    const result = await removeMember("my-workspace", "member-1");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  it("prevents owner from removing themselves", async () => {
    mockFindUnique.mockResolvedValue({
      id: "member-1",
      workspaceId: "ws-1",
      userId: "owner-1",
      role: "OWNER",
    });

    const result = await removeMember("my-workspace", "member-1");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/cannot remove yourself/i);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("removes an editor member successfully", async () => {
    mockFindUnique.mockResolvedValue({
      id: "member-1",
      workspaceId: "ws-1",
      userId: "user-2",
      role: "EDITOR",
    });
    mockDelete.mockResolvedValue({});

    const result = await removeMember("my-workspace", "member-1");

    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "member-1" } });
  });

  it("removes a viewer member successfully", async () => {
    mockFindUnique.mockResolvedValue({
      id: "member-2",
      workspaceId: "ws-1",
      userId: "user-3",
      role: "VIEWER",
    });
    mockDelete.mockResolvedValue({});

    const result = await removeMember("my-workspace", "member-2");

    expect(result.success).toBe(true);
  });
});
