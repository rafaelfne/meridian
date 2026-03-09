import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/workspace-context", () => ({
  requireWorkspaceAccess: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    apiKey: { findFirst: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revokeApiKey } from "./revoke-api-key";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { prisma } from "@/lib/prisma";

const mockRequireAccess = requireWorkspaceAccess as ReturnType<typeof vi.fn>;
const mockFindFirst = prisma.apiKey.findFirst as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.apiKey.update as ReturnType<typeof vi.fn>;

const VALID_KEY_ID = "cm1234567890abcdef12345";

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("revokeApiKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAccess.mockResolvedValue({
      workspaceId: "ws-1",
      userId: "user-1",
      role: "OWNER",
    });
  });

  it("returns validation error for invalid keyId", async () => {
    const result = await revokeApiKey(
      "my-workspace",
      makeFormData({ keyId: "not-a-cuid" }),
    );
    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error.keyId");
  });

  it("returns error when key not found", async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await revokeApiKey(
      "my-workspace",
      makeFormData({ keyId: VALID_KEY_ID }),
    );

    expect(result.success).toBe(false);
    expect(result.error?.keyId?.[0]).toMatch(/not found/i);
  });

  it("returns error when key belongs to different workspace", async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await revokeApiKey(
      "my-workspace",
      makeFormData({ keyId: VALID_KEY_ID }),
    );

    expect(result.success).toBe(false);
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: {
        id: VALID_KEY_ID,
        workspaceId: "ws-1",
        revokedAt: null,
      },
    });
  });

  it("sets revokedAt on success", async () => {
    mockFindFirst.mockResolvedValue({ id: VALID_KEY_ID });
    mockUpdate.mockResolvedValue({});

    const before = new Date();
    const result = await revokeApiKey(
      "my-workspace",
      makeFormData({ keyId: VALID_KEY_ID }),
    );
    const after = new Date();

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: VALID_KEY_ID },
      data: { revokedAt: expect.any(Date) },
    });
    const revokedAt = mockUpdate.mock.calls[0]![0].data.revokedAt;
    expect(revokedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(revokedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
