import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/workspace-context", () => ({
  requireWorkspaceAccess: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    document: { findFirst: vi.fn(), delete: vi.fn() },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { deleteDocument } from "./delete-document";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { prisma } from "@/lib/prisma";

const mockRequireAccess = requireWorkspaceAccess as ReturnType<typeof vi.fn>;
const mockDocFindFirst = prisma.document.findFirst as ReturnType<typeof vi.fn>;
const mockDocDelete = prisma.document.delete as ReturnType<typeof vi.fn>;

describe("deleteDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccess.mockResolvedValue({
      workspaceId: "ws-1",
      userId: "owner-1",
      role: "OWNER",
    });
  });

  it("returns error when document is not found", async () => {
    mockDocFindFirst.mockResolvedValue(null);

    const result = await deleteDocument("my-workspace", "my-system", "my-doc");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/document not found/i);
    expect(mockDocDelete).not.toHaveBeenCalled();
  });

  it("deletes document successfully", async () => {
    mockDocFindFirst.mockResolvedValue({ id: "doc-1" });
    mockDocDelete.mockResolvedValue({});

    const result = await deleteDocument("my-workspace", "my-system", "my-doc");

    expect(result.success).toBe(true);
    expect(mockDocDelete).toHaveBeenCalledWith({ where: { id: "doc-1" } });
  });

  it("queries document scoped to workspace via system and domain", async () => {
    mockDocFindFirst.mockResolvedValue({ id: "doc-1" });
    mockDocDelete.mockResolvedValue({});

    await deleteDocument("my-workspace", "my-system", "my-doc");

    expect(mockDocFindFirst).toHaveBeenCalledWith({
      where: {
        slug: "my-doc",
        system: {
          slug: "my-system",
          domain: { workspace: { slug: "my-workspace" } },
        },
      },
    });
  });

  it("requires OWNER access", async () => {
    mockDocFindFirst.mockResolvedValue(null);

    await deleteDocument("my-workspace", "my-system", "my-doc");

    expect(mockRequireAccess).toHaveBeenCalledWith("my-workspace", "OWNER");
  });
});
