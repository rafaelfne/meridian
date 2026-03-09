import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    passwordResetToken: { findFirst: vi.fn(), update: vi.fn() },
    user: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("new-hashed-password"),
}));
vi.mock("@/lib/tokens", () => ({
  hashToken: vi.fn().mockReturnValue("hashed-token"),
}));

import { resetPassword } from "./reset-password";
import { prisma } from "@/lib/prisma";

const mockFindFirst = prisma.passwordResetToken.findFirst as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const validFields = {
  token: "raw-token-abc",
  password: "NewPass1234",
  confirmPassword: "NewPass1234",
};

const initial = { success: false, error: "" };

describe("resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error for weak password", async () => {
    const result = await resetPassword(
      initial,
      makeFormData({ ...validFields, password: "weak", confirmPassword: "weak" }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error for mismatched passwords", async () => {
    const result = await resetPassword(
      initial,
      makeFormData({ ...validFields, confirmPassword: "DifferentPass1" }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/do not match/i);
  });

  it("returns error for missing token", async () => {
    const result = await resetPassword(
      initial,
      makeFormData({ ...validFields, token: "" }),
    );
    expect(result.success).toBe(false);
  });

  it("returns error when token is invalid or expired", async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await resetPassword(initial, makeFormData(validFields));

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid or has expired/i);
  });

  it("updates password and bumps tokenVersion on success", async () => {
    mockFindFirst.mockResolvedValue({ id: "token-1", userId: "user-1" });
    mockTransaction.mockResolvedValue(undefined);

    const result = await resetPassword(initial, makeFormData(validFields));

    expect(result.success).toBe(true);
    expect(mockTransaction).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({}), // user update
        expect.objectContaining({}), // token update
      ]),
    );
  });

  it("looks up token with correct hash and filters", async () => {
    mockFindFirst.mockResolvedValue(null);

    await resetPassword(initial, makeFormData(validFields));

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: {
        tokenHash: "hashed-token",
        usedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      select: { id: true, userId: true },
    });
  });
});
