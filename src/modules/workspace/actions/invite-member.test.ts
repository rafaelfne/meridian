import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/workspace-context", () => ({
  requireWorkspaceAccess: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    workspaceMember: { findUnique: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { inviteMember } from "./invite-member";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { prisma } from "@/lib/prisma";

const mockRequireAccess = requireWorkspaceAccess as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockMemberFindUnique = prisma.workspaceMember.findUnique as ReturnType<typeof vi.fn>;
const mockMemberCreate = prisma.workspaceMember.create as ReturnType<typeof vi.fn>;

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const VALID_USER_ID = "cm1234567890abcdef12345";

describe("inviteMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccess.mockResolvedValue({
      workspaceId: "ws-1",
      userId: "owner-1",
      role: "OWNER",
    });
  });

  it("returns validation error for invalid userId", async () => {
    const result = await inviteMember(
      "my-workspace",
      makeFormData({ userId: "not-a-cuid", role: "EDITOR" }),
    );

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.userId");
  });

  it("returns validation error for invalid role", async () => {
    const result = await inviteMember(
      "my-workspace",
      makeFormData({ userId: VALID_USER_ID, role: "OWNER" }),
    );

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.role");
  });

  it("returns error when user does not exist", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const result = await inviteMember(
      "my-workspace",
      makeFormData({ userId: VALID_USER_ID, role: "EDITOR" }),
    );

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.userId");
  });

  it("returns error when user is already a member", async () => {
    mockUserFindUnique.mockResolvedValue({ id: VALID_USER_ID });
    mockMemberFindUnique.mockResolvedValue({ id: "member-1" });

    const result = await inviteMember(
      "my-workspace",
      makeFormData({ userId: VALID_USER_ID, role: "EDITOR" }),
    );

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.userId");
  });

  it("creates member and returns success", async () => {
    mockUserFindUnique.mockResolvedValue({ id: VALID_USER_ID });
    mockMemberFindUnique.mockResolvedValue(null);
    mockMemberCreate.mockResolvedValue({});

    const result = await inviteMember(
      "my-workspace",
      makeFormData({ userId: VALID_USER_ID, role: "EDITOR" }),
    );

    expect(result.success).toBe(true);
    expect(mockMemberCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: VALID_USER_ID,
        workspaceId: "ws-1",
        role: "EDITOR",
      }),
    });
  });

  it("creates member with VIEWER role", async () => {
    mockUserFindUnique.mockResolvedValue({ id: VALID_USER_ID });
    mockMemberFindUnique.mockResolvedValue(null);
    mockMemberCreate.mockResolvedValue({});

    const result = await inviteMember(
      "my-workspace",
      makeFormData({ userId: VALID_USER_ID, role: "VIEWER" }),
    );

    expect(result.success).toBe(true);
    expect(mockMemberCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ role: "VIEWER" }),
    });
  });
});
