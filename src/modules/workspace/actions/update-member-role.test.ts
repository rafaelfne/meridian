import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/workspace-context", () => ({
  requireWorkspaceAccess: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceMember: { findUnique: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateMemberRole } from "./update-member-role";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { prisma } from "@/lib/prisma";

const mockRequireAccess = requireWorkspaceAccess as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.workspaceMember.findUnique as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.workspaceMember.update as ReturnType<typeof vi.fn>;

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const VALID_MEMBER_ID = "cm1234567890abcdef12345";

describe("updateMemberRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccess.mockResolvedValue({
      workspaceId: "ws-1",
      userId: "owner-1",
      role: "OWNER",
    });
  });

  it("returns validation error for invalid memberId", async () => {
    const result = await updateMemberRole(
      "my-workspace",
      makeFormData({ memberId: "bad-id", role: "EDITOR" }),
    );

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.memberId");
  });

  it("returns validation error for OWNER role", async () => {
    const result = await updateMemberRole(
      "my-workspace",
      makeFormData({ memberId: VALID_MEMBER_ID, role: "OWNER" }),
    );

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.role");
  });

  it("returns error when member is not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await updateMemberRole(
      "my-workspace",
      makeFormData({ memberId: VALID_MEMBER_ID, role: "EDITOR" }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  it("returns error when member belongs to a different workspace", async () => {
    mockFindUnique.mockResolvedValue({
      id: VALID_MEMBER_ID,
      workspaceId: "ws-other",
      role: "EDITOR",
    });

    const result = await updateMemberRole(
      "my-workspace",
      makeFormData({ memberId: VALID_MEMBER_ID, role: "VIEWER" }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  it("prevents changing role of an owner", async () => {
    mockFindUnique.mockResolvedValue({
      id: VALID_MEMBER_ID,
      workspaceId: "ws-1",
      role: "OWNER",
    });

    const result = await updateMemberRole(
      "my-workspace",
      makeFormData({ memberId: VALID_MEMBER_ID, role: "EDITOR" }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/cannot change role of an owner/i);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates role to VIEWER successfully", async () => {
    mockFindUnique.mockResolvedValue({
      id: VALID_MEMBER_ID,
      workspaceId: "ws-1",
      role: "EDITOR",
    });
    mockUpdate.mockResolvedValue({});

    const result = await updateMemberRole(
      "my-workspace",
      makeFormData({ memberId: VALID_MEMBER_ID, role: "VIEWER" }),
    );

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: VALID_MEMBER_ID },
      data: { role: "VIEWER" },
    });
  });

  it("updates role to EDITOR successfully", async () => {
    mockFindUnique.mockResolvedValue({
      id: VALID_MEMBER_ID,
      workspaceId: "ws-1",
      role: "VIEWER",
    });
    mockUpdate.mockResolvedValue({});

    const result = await updateMemberRole(
      "my-workspace",
      makeFormData({ memberId: VALID_MEMBER_ID, role: "EDITOR" }),
    );

    expect(result.success).toBe(true);
  });
});
