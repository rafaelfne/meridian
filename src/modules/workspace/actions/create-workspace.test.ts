import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspace: { findUnique: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn() },
    workspaceMember: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { createWorkspace } from "./create-workspace";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockWorkspaceFindUnique = prisma.workspace.findUnique as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("createWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(
      createWorkspace(makeFormData({ name: "Acme", slug: "acme" })),
    ).rejects.toThrow("REDIRECT:/login");
  });

  it("returns validation error for empty name", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const result = await createWorkspace(
      makeFormData({ name: "", slug: "acme" }),
    );

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.name");
  });

  it("returns validation error for invalid slug", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const result = await createWorkspace(
      makeFormData({ name: "Acme", slug: "My Workspace!" }),
    );

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.slug");
  });

  it("returns error when slug is already taken", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockWorkspaceFindUnique.mockResolvedValue({ id: "ws-existing" });

    const result = await createWorkspace(
      makeFormData({ name: "Acme", slug: "acme" }),
    );

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.slug");
  });

  it("returns error when user does not exist in DB", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockWorkspaceFindUnique.mockResolvedValue(null);
    mockUserFindUnique.mockResolvedValue(null);

    const result = await createWorkspace(
      makeFormData({ name: "Acme", slug: "acme" }),
    );

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.name");
  });

  it("creates workspace and returns slug on success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockWorkspaceFindUnique.mockResolvedValue(null);
    mockUserFindUnique.mockResolvedValue({ id: "user-1" });
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        workspace: { create: vi.fn().mockResolvedValue({ id: "ws-1", slug: "acme" }) },
        workspaceMember: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const result = await createWorkspace(
      makeFormData({ name: "Acme", slug: "acme" }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: "ws-1", slug: "acme" });
    }
  });

  it("includes optional description when provided", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockWorkspaceFindUnique.mockResolvedValue(null);
    mockUserFindUnique.mockResolvedValue({ id: "user-1" });

    const workspaceCreate = vi.fn().mockResolvedValue({ id: "ws-1", slug: "acme" });
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        workspace: { create: workspaceCreate },
        workspaceMember: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    await createWorkspace(
      makeFormData({ name: "Acme", slug: "acme", description: "A cool workspace" }),
    );

    expect(workspaceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: "A cool workspace" }),
      }),
    );
  });
});
