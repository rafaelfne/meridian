import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceMember: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { requireWorkspaceAccess, verifyWorkspaceAccess } from "./workspace-context";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockFindFirst = prisma.workspaceMember.findFirst as ReturnType<typeof vi.fn>;

describe("requireWorkspaceAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login if no session", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(requireWorkspaceAccess("my-workspace")).rejects.toThrow(
      "REDIRECT:/login",
    );
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /workspaces if user is not a member", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindFirst.mockResolvedValue(null);

    await expect(requireWorkspaceAccess("my-workspace")).rejects.toThrow(
      "REDIRECT:/workspaces",
    );
    expect(redirect).toHaveBeenCalledWith("/workspaces");
  });

  it("returns context for valid member", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindFirst.mockResolvedValue({
      role: "EDITOR",
      workspace: { id: "ws-1" },
    });

    const ctx = await requireWorkspaceAccess("my-workspace");
    expect(ctx).toEqual({
      workspaceId: "ws-1",
      userId: "user-1",
      role: "EDITOR",
    });
  });

  it("enforces minimum role — VIEWER cannot access EDITOR-minimum", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindFirst.mockResolvedValue({
      role: "VIEWER",
      workspace: { id: "ws-1" },
    });

    await expect(
      requireWorkspaceAccess("my-workspace", "EDITOR"),
    ).rejects.toThrow("REDIRECT:/workspaces");
  });

  it("enforces minimum role — EDITOR can access EDITOR-minimum", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindFirst.mockResolvedValue({
      role: "EDITOR",
      workspace: { id: "ws-1" },
    });

    const ctx = await requireWorkspaceAccess("my-workspace", "EDITOR");
    expect(ctx.role).toBe("EDITOR");
  });

  it("enforces minimum role — OWNER can access EDITOR-minimum", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindFirst.mockResolvedValue({
      role: "OWNER",
      workspace: { id: "ws-1" },
    });

    const ctx = await requireWorkspaceAccess("my-workspace", "EDITOR");
    expect(ctx.role).toBe("OWNER");
  });

  it("enforces OWNER minimum — EDITOR cannot access", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindFirst.mockResolvedValue({
      role: "EDITOR",
      workspace: { id: "ws-1" },
    });

    await expect(
      requireWorkspaceAccess("my-workspace", "OWNER"),
    ).rejects.toThrow("REDIRECT:/workspaces");
  });
});

describe("verifyWorkspaceAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null if no session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await verifyWorkspaceAccess("my-workspace");
    expect(result).toBeNull();
  });

  it("returns null if user is not a member", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindFirst.mockResolvedValue(null);

    const result = await verifyWorkspaceAccess("my-workspace");
    expect(result).toBeNull();
  });

  it("returns context for valid member", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindFirst.mockResolvedValue({
      role: "VIEWER",
      workspace: { id: "ws-1" },
    });

    const result = await verifyWorkspaceAccess("my-workspace");
    expect(result).toEqual({
      workspaceId: "ws-1",
      userId: "user-1",
      role: "VIEWER",
    });
  });

  it("returns null if role is insufficient", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindFirst.mockResolvedValue({
      role: "VIEWER",
      workspace: { id: "ws-1" },
    });

    const result = await verifyWorkspaceAccess("my-workspace", "EDITOR");
    expect(result).toBeNull();
  });
});
