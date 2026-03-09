import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/workspace-context", () => ({
  requireWorkspaceAccess: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    apiKey: { count: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@/lib/tokens", () => ({
  generateApiKey: vi.fn().mockReturnValue({
    raw: "mrdn_live_abc12345def67890abc12345def67890",
    prefix: "mrdn_live_abc12345",
    hash: "fakehash123",
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createApiKey } from "./create-api-key";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { prisma } from "@/lib/prisma";

const mockRequireAccess = requireWorkspaceAccess as ReturnType<typeof vi.fn>;
const mockCount = prisma.apiKey.count as ReturnType<typeof vi.fn>;
const mockCreate = prisma.apiKey.create as ReturnType<typeof vi.fn>;

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("createApiKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccess.mockResolvedValue({
      workspaceId: "ws-1",
      userId: "user-1",
      role: "OWNER",
    });
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue({ id: "key-1" });
  });

  it("returns validation error for empty name", async () => {
    const result = await createApiKey(
      "my-workspace",
      makeFormData({ name: "", expires: "never" }),
    );
    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.name");
  });

  it("returns validation error for name exceeding 100 chars", async () => {
    const result = await createApiKey(
      "my-workspace",
      makeFormData({ name: "a".repeat(101), expires: "never" }),
    );
    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.name");
  });

  it("returns validation error for invalid expiry value", async () => {
    const result = await createApiKey(
      "my-workspace",
      makeFormData({ name: "test-key", expires: "invalid" }),
    );
    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.expires");
  });

  it("returns error when 10 active keys already exist", async () => {
    mockCount.mockResolvedValue(10);

    const result = await createApiKey(
      "my-workspace",
      makeFormData({ name: "test-key", expires: "never" }),
    );

    expect(result.success).toBe(false);
    expect(result.error?.name?.[0]).toMatch(/maximum/i);
  });

  it("creates key and returns raw key on success", async () => {
    const result = await createApiKey(
      "my-workspace",
      makeFormData({ name: "github-actions", expires: "never" }),
    );

    expect(result.success).toBe(true);
    expect(result).toHaveProperty("data.raw", "mrdn_live_abc12345def67890abc12345def67890");
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workspaceId: "ws-1",
        name: "github-actions",
        keyHash: "fakehash123",
        keyPrefix: "mrdn_live_abc12345",
        expiresAt: null,
        createdBy: "user-1",
      }),
    });
  });

  it("sets expiresAt for 30d option", async () => {
    const before = Date.now();
    const result = await createApiKey(
      "my-workspace",
      makeFormData({ name: "test-key", expires: "30d" }),
    );
    const after = Date.now();

    expect(result.success).toBe(true);
    const callArgs = mockCreate.mock.calls[0]![0].data;
    const expiresMs = new Date(callArgs.expiresAt).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(expiresMs).toBeGreaterThanOrEqual(before + thirtyDaysMs);
    expect(expiresMs).toBeLessThanOrEqual(after + thirtyDaysMs);
  });

  it("sets expiresAt for 90d option", async () => {
    const result = await createApiKey(
      "my-workspace",
      makeFormData({ name: "test-key", expires: "90d" }),
    );

    expect(result.success).toBe(true);
    const callArgs = mockCreate.mock.calls[0]![0].data;
    expect(callArgs.expiresAt).toBeTruthy();
  });

  it("sets expiresAt for 1y option", async () => {
    const result = await createApiKey(
      "my-workspace",
      makeFormData({ name: "test-key", expires: "1y" }),
    );

    expect(result.success).toBe(true);
    const callArgs = mockCreate.mock.calls[0]![0].data;
    expect(callArgs.expiresAt).toBeTruthy();
  });

  it("stores hash and prefix, not raw key", async () => {
    await createApiKey(
      "my-workspace",
      makeFormData({ name: "test-key", expires: "never" }),
    );

    const callArgs = mockCreate.mock.calls[0]![0].data;
    expect(callArgs.keyHash).toBe("fakehash123");
    expect(callArgs.keyPrefix).toBe("mrdn_live_abc12345");
    expect(callArgs).not.toHaveProperty("raw");
  });
});
