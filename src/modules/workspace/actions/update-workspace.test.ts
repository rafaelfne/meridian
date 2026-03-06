import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/workspace-context", () => ({
  requireWorkspaceAccess: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspace: { update: vi.fn() },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateWorkspace } from "./update-workspace";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { prisma } from "@/lib/prisma";

const mockRequireAccess = requireWorkspaceAccess as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.workspace.update as ReturnType<typeof vi.fn>;

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("updateWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccess.mockResolvedValue({
      workspaceId: "ws-1",
      userId: "user-1",
      role: "EDITOR",
    });
    mockUpdate.mockResolvedValue({});
  });

  it("returns validation error for empty name", async () => {
    const result = await updateWorkspace(
      "my-workspace",
      makeFormData({ name: "" }),
    );

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.name");
  });

  it("updates workspace name successfully", async () => {
    const result = await updateWorkspace(
      "my-workspace",
      makeFormData({ name: "New Name" }),
    );

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "ws-1" },
      data: { name: "New Name", description: null },
    });
  });

  it("updates workspace with description", async () => {
    const result = await updateWorkspace(
      "my-workspace",
      makeFormData({ name: "New Name", description: "A description" }),
    );

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "ws-1" },
      data: { name: "New Name", description: "A description" },
    });
  });

  it("sets description to null when empty string provided", async () => {
    const result = await updateWorkspace(
      "my-workspace",
      makeFormData({ name: "New Name", description: "" }),
    );

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "ws-1" },
      data: { name: "New Name", description: null },
    });
  });

  it("requires EDITOR access", async () => {
    await updateWorkspace("my-workspace", makeFormData({ name: "Test" }));

    expect(mockRequireAccess).toHaveBeenCalledWith("my-workspace", "EDITOR");
  });
});
