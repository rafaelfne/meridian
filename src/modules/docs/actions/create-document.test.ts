import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/workspace-context", () => ({
  requireWorkspaceAccess: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    system: { findFirst: vi.fn() },
    document: { findUnique: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createDocument } from "./create-document";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { prisma } from "@/lib/prisma";

const mockRequireAccess = requireWorkspaceAccess as ReturnType<typeof vi.fn>;
const mockSystemFindFirst = prisma.system.findFirst as ReturnType<typeof vi.fn>;
const mockDocFindUnique = prisma.document.findUnique as ReturnType<typeof vi.fn>;
const mockDocCreate = prisma.document.create as ReturnType<typeof vi.fn>;

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("createDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccess.mockResolvedValue({
      workspaceId: "ws-1",
      userId: "user-1",
      role: "EDITOR",
    });
  });

  it("returns validation error for empty title", async () => {
    const result = await createDocument(
      "my-workspace",
      "my-system",
      makeFormData({ title: "", slug: "my-doc", content: "" }),
    );

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.title");
  });

  it("returns validation error for invalid slug", async () => {
    const result = await createDocument(
      "my-workspace",
      "my-system",
      makeFormData({ title: "My Doc", slug: "Invalid Slug!", content: "" }),
    );

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.slug");
  });

  it("returns error when system is not found", async () => {
    mockSystemFindFirst.mockResolvedValue(null);

    const result = await createDocument(
      "my-workspace",
      "my-system",
      makeFormData({ title: "My Doc", slug: "my-doc", content: "" }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/system not found/i);
  });

  it("returns error when document slug already exists for this system", async () => {
    mockSystemFindFirst.mockResolvedValue({ id: "sys-1" });
    mockDocFindUnique.mockResolvedValue({ id: "doc-existing" });

    const result = await createDocument(
      "my-workspace",
      "my-system",
      makeFormData({ title: "My Doc", slug: "my-doc", content: "" }),
    );

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.slug");
  });

  it("creates document and returns id and slug on success", async () => {
    mockSystemFindFirst.mockResolvedValue({ id: "sys-1" });
    mockDocFindUnique.mockResolvedValue(null);
    mockDocCreate.mockResolvedValue({ id: "doc-1", slug: "my-doc" });

    const result = await createDocument(
      "my-workspace",
      "my-system",
      makeFormData({ title: "My Doc", slug: "my-doc", content: "# Hello" }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: "doc-1", slug: "my-doc" });
    }
    expect(mockDocCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "My Doc",
        slug: "my-doc",
        content: "# Hello",
        systemId: "sys-1",
        authorId: "user-1",
      }),
    });
  });

  it("requires EDITOR access", async () => {
    mockSystemFindFirst.mockResolvedValue(null);

    await createDocument(
      "my-workspace",
      "my-system",
      makeFormData({ title: "Doc", slug: "doc", content: "" }),
    );

    expect(mockRequireAccess).toHaveBeenCalledWith("my-workspace", "EDITOR");
  });
});
