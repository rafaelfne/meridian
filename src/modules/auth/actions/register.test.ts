import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed-password"),
}));

import { register } from "./register";
import { prisma } from "@/lib/prisma";

const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockCreate = prisma.user.create as ReturnType<typeof vi.fn>;

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const validFields = {
  name: "John Doe",
  email: "john@example.com",
  password: "Abcdef1234",
  confirmPassword: "Abcdef1234",
};

const initial = { success: false };

describe("register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validation error for missing name", async () => {
    const result = await register(initial, makeFormData({ ...validFields, name: "" }));
    expect(result.success).toBe(false);
    expect(result.error).toHaveProperty("name");
  });

  it("returns validation error for invalid email", async () => {
    const result = await register(initial, makeFormData({ ...validFields, email: "bad" }));
    expect(result.success).toBe(false);
    expect(result.error).toHaveProperty("email");
  });

  it("returns validation error for weak password", async () => {
    const result = await register(
      initial,
      makeFormData({ ...validFields, password: "weak", confirmPassword: "weak" }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toHaveProperty("password");
  });

  it("returns validation error for mismatched passwords", async () => {
    const result = await register(
      initial,
      makeFormData({ ...validFields, confirmPassword: "Different1234" }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toHaveProperty("confirmPassword");
  });

  it("returns error when email already exists", async () => {
    mockFindUnique.mockResolvedValue({ id: "existing-user" });

    const result = await register(initial, makeFormData(validFields));

    expect(result.success).toBe(false);
    expect(result.error?.email?.[0]).toMatch(/already exists/i);
  });

  it("creates user with hashed password on success", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "new-user" });

    const result = await register(initial, makeFormData(validFields));

    expect(result.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        name: "John Doe",
        email: "john@example.com",
        password: "hashed-password",
      },
    });
  });
});
