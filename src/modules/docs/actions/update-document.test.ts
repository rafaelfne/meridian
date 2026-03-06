import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/workspace-context", () => ({
  requireWorkspaceAccess: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    document: { findFirst: vi.fn(), update: vi.fn() },
    documentRevision: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateDocument } from "./update-document";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { prisma } from "@/lib/prisma";

const mockRequireAccess = requireWorkspaceAccess as ReturnType<typeof vi.fn>;
const mockDocFindFirst = prisma.document.findFirst as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("updateDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccess.mockResolvedValue({
      workspaceId: "ws-1",
      userId: "user-1",
      role: "EDITOR",
    });
  });

  it("omits title update when empty string is provided (treated as absent)", async () => {
    // formData.get("title") || undefined converts empty string to undefined
    // so empty title is treated as "no title change"
    mockDocFindFirst.mockResolvedValue({ id: "doc-1", content: "old" });
    mockTransaction.mockResolvedValue([{}, {}]);

    const result = await updateDocument(
      "my-workspace",
      "my-system",
      "my-doc",
      makeFormData({ title: "", content: "# New content" }),
    );

    expect(result.success).toBe(true);
    expect(prisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ title: expect.anything() }),
      }),
    );
  });

  it("returns error when document is not found", async () => {
    mockDocFindFirst.mockResolvedValue(null);

    const result = await updateDocument(
      "my-workspace",
      "my-system",
      "my-doc",
      makeFormData({ title: "New Title", content: "# Content" }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/document not found/i);
  });

  it("creates a revision and updates document on success", async () => {
    const existingDoc = {
      id: "doc-1",
      content: "old content",
    };
    mockDocFindFirst.mockResolvedValue(existingDoc);
    mockTransaction.mockResolvedValue([{}, {}]);

    const result = await updateDocument(
      "my-workspace",
      "my-system",
      "my-doc",
      makeFormData({ title: "New Title", content: "# Updated" }),
    );

    expect(result.success).toBe(true);
    // $transaction is called with an array built from the two Prisma calls
    expect(mockTransaction).toHaveBeenCalled();
    // Both underlying calls are evaluated before being passed to $transaction
    expect(prisma.documentRevision.create).toHaveBeenCalled();
    expect(prisma.document.update).toHaveBeenCalled();
  });

  it("passes old content to revision", async () => {
    const existingDoc = { id: "doc-1", content: "original content" };
    mockDocFindFirst.mockResolvedValue(existingDoc);
    mockTransaction.mockResolvedValue([{}, {}]);

    await updateDocument(
      "my-workspace",
      "my-system",
      "my-doc",
      makeFormData({ content: "new content" }),
    );

    // Verify revision.create was called with old content
    expect(prisma.documentRevision.create).toHaveBeenCalledWith({
      data: {
        content: "original content",
        documentId: "doc-1",
        authorId: "user-1",
      },
    });
  });

  it("queries document scoped to workspace, system, and domain", async () => {
    mockDocFindFirst.mockResolvedValue(null);

    await updateDocument(
      "my-workspace",
      "my-system",
      "my-doc",
      makeFormData({ content: "content" }),
    );

    expect(mockDocFindFirst).toHaveBeenCalledWith({
      where: {
        slug: "my-doc",
        system: {
          slug: "my-system",
          domain: { workspaceId: "ws-1" },
        },
      },
    });
  });

  it("requires EDITOR access", async () => {
    mockDocFindFirst.mockResolvedValue(null);

    await updateDocument(
      "my-workspace",
      "my-system",
      "my-doc",
      makeFormData({ content: "" }),
    );

    expect(mockRequireAccess).toHaveBeenCalledWith("my-workspace", "EDITOR");
  });
});
