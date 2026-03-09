import { describe, it, expect } from "vitest";
import { CreateApiKeySchema, RevokeApiKeySchema } from "./api-key-schema";

describe("CreateApiKeySchema", () => {
  it("accepts valid input with never expiry", () => {
    const result = CreateApiKeySchema.safeParse({
      name: "github-actions",
      expires: "never",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with 30d expiry", () => {
    const result = CreateApiKeySchema.safeParse({
      name: "ci-pipeline",
      expires: "30d",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with 90d expiry", () => {
    const result = CreateApiKeySchema.safeParse({
      name: "ci-pipeline",
      expires: "90d",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with 1y expiry", () => {
    const result = CreateApiKeySchema.safeParse({
      name: "ci-pipeline",
      expires: "1y",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = CreateApiKeySchema.safeParse({
      name: "",
      expires: "never",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 characters", () => {
    const result = CreateApiKeySchema.safeParse({
      name: "a".repeat(101),
      expires: "never",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid expiry value", () => {
    const result = CreateApiKeySchema.safeParse({
      name: "test",
      expires: "2w",
    });
    expect(result.success).toBe(false);
  });
});

describe("RevokeApiKeySchema", () => {
  it("accepts valid cuid", () => {
    const result = RevokeApiKeySchema.safeParse({
      keyId: "cm1234567890abcdef12345",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid id", () => {
    const result = RevokeApiKeySchema.safeParse({
      keyId: "not-a-cuid",
    });
    expect(result.success).toBe(false);
  });
});
