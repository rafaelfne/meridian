import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    passwordResetToken: { create: vi.fn() },
  },
}));
vi.mock("@/lib/tokens", () => ({
  generateResetToken: vi.fn().mockReturnValue({ raw: "raw-token-123", hash: "hashed-token-123" }),
}));
vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

import { forgotPassword } from "./forgot-password";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const mockUserFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockTokenCreate = prisma.passwordResetToken.create as ReturnType<typeof vi.fn>;
const mockSendEmail = sendPasswordResetEmail as ReturnType<typeof vi.fn>;

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const initial = { success: false, error: "" };

describe("forgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validation error for invalid email", async () => {
    const result = await forgotPassword(initial, makeFormData({ email: "bad" }));
    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error");
  });

  it("returns generic success when user does not exist (anti-enumeration)", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const result = await forgotPassword(initial, makeFormData({ email: "nobody@example.com" }));

    expect(result.success).toBe(true);
    expect(result).toHaveProperty("message");
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("returns generic success when user has no password (GitHub-only)", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "user-1", password: null });

    const result = await forgotPassword(initial, makeFormData({ email: "github@example.com" }));

    expect(result.success).toBe(true);
    expect(result).toHaveProperty("message");
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("creates token and sends email for valid user with password", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "user-1", password: "hashed" });
    mockTokenCreate.mockResolvedValue({ id: "token-1" });

    const result = await forgotPassword(initial, makeFormData({ email: "john@example.com" }));

    expect(result.success).toBe(true);
    expect(result).toHaveProperty("message");
    expect(mockTokenCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        tokenHash: "hashed-token-123",
      }),
    });
    expect(mockSendEmail).toHaveBeenCalledWith(
      "john@example.com",
      expect.stringContaining("raw-token-123"),
    );
  });

  it("returns same message for existing and non-existing users", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const resultNotFound = await forgotPassword(initial, makeFormData({ email: "a@b.com" }));

    mockUserFindUnique.mockResolvedValue({ id: "user-1", password: "hashed" });
    mockTokenCreate.mockResolvedValue({ id: "token-1" });
    const resultFound = await forgotPassword(initial, makeFormData({ email: "a@b.com" }));

    expect(resultNotFound.success).toBe(true);
    expect(resultFound.success).toBe(true);
    expect((resultNotFound as { message: string }).message).toBe(
      (resultFound as { message: string }).message,
    );
  });
});
