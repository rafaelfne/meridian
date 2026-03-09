import { describe, it, expect } from "vitest";
import { generateResetToken, hashToken } from "./tokens";

describe("generateResetToken", () => {
  it("returns raw and hash strings", () => {
    const { raw, hash } = generateResetToken();
    expect(typeof raw).toBe("string");
    expect(typeof hash).toBe("string");
    expect(raw.length).toBe(64); // 32 bytes hex-encoded
    expect(hash.length).toBe(64); // SHA-256 hex-encoded
  });

  it("generates different tokens each call", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).not.toBe(b.hash);
  });

  it("hash matches hashToken of raw", () => {
    const { raw, hash } = generateResetToken();
    expect(hashToken(raw)).toBe(hash);
  });
});

describe("hashToken", () => {
  it("returns consistent hash for same input", () => {
    const hash1 = hashToken("test-token");
    const hash2 = hashToken("test-token");
    expect(hash1).toBe(hash2);
  });

  it("returns different hashes for different inputs", () => {
    const hash1 = hashToken("token-a");
    const hash2 = hashToken("token-b");
    expect(hash1).not.toBe(hash2);
  });

  it("returns a 64-character hex string (SHA-256)", () => {
    const hash = hashToken("anything");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
