import { describe, it, expect } from "vitest";
import {
  SignUpSchema,
  SignInSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "./auth-schema";

describe("SignUpSchema", () => {
  const valid = {
    name: "John Doe",
    email: "john@example.com",
    password: "Abcdef1234",
    confirmPassword: "Abcdef1234",
  };

  it("accepts valid input", () => {
    const result = SignUpSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = SignUpSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = SignUpSchema.safeParse({ ...valid, email: "not-email" });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = SignUpSchema.safeParse({
      ...valid,
      password: "Abc1",
      confirmPassword: "Abc1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password longer than 128 characters", () => {
    const long = "A1" + "a".repeat(127);
    const result = SignUpSchema.safeParse({
      ...valid,
      password: long,
      confirmPassword: long,
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without lowercase letter", () => {
    const result = SignUpSchema.safeParse({
      ...valid,
      password: "ABCDEFGH1",
      confirmPassword: "ABCDEFGH1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase letter", () => {
    const result = SignUpSchema.safeParse({
      ...valid,
      password: "abcdefgh1",
      confirmPassword: "abcdefgh1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = SignUpSchema.safeParse({
      ...valid,
      password: "Abcdefghi",
      confirmPassword: "Abcdefghi",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched confirmPassword", () => {
    const result = SignUpSchema.safeParse({
      ...valid,
      confirmPassword: "Different1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });
});

describe("SignInSchema", () => {
  it("accepts valid input", () => {
    const result = SignInSchema.safeParse({
      email: "john@example.com",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = SignInSchema.safeParse({
      email: "bad",
      password: "anything",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = SignInSchema.safeParse({
      email: "john@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("ForgotPasswordSchema", () => {
  it("accepts valid email", () => {
    const result = ForgotPasswordSchema.safeParse({ email: "john@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = ForgotPasswordSchema.safeParse({ email: "not-valid" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = ForgotPasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("ResetPasswordSchema", () => {
  const valid = {
    token: "abc123",
    password: "NewPass1234",
    confirmPassword: "NewPass1234",
  };

  it("accepts valid input", () => {
    const result = ResetPasswordSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects empty token", () => {
    const result = ResetPasswordSchema.safeParse({ ...valid, token: "" });
    expect(result.success).toBe(false);
  });

  it("rejects weak password", () => {
    const result = ResetPasswordSchema.safeParse({
      ...valid,
      password: "weak",
      confirmPassword: "weak",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched confirmPassword", () => {
    const result = ResetPasswordSchema.safeParse({
      ...valid,
      confirmPassword: "Different1234",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });
});
