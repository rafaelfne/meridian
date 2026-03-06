import { describe, it, expect } from "vitest";
import {
  CreateWorkspaceSchema,
  InviteMemberSchema,
  UpdateMemberRoleSchema,
} from "./workspace-schema";

describe("CreateWorkspaceSchema", () => {
  it("validates a correct workspace", () => {
    const result = CreateWorkspaceSchema.safeParse({
      name: "My Workspace",
      slug: "my-workspace",
      description: "A test workspace",
    });
    expect(result.success).toBe(true);
  });

  it("accepts missing description", () => {
    const result = CreateWorkspaceSchema.safeParse({
      name: "My Workspace",
      slug: "my-workspace",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = CreateWorkspaceSchema.safeParse({
      name: "",
      slug: "my-workspace",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with uppercase letters", () => {
    const result = CreateWorkspaceSchema.safeParse({
      name: "Test",
      slug: "My-Workspace",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with spaces", () => {
    const result = CreateWorkspaceSchema.safeParse({
      name: "Test",
      slug: "my workspace",
    });
    expect(result.success).toBe(false);
  });

  it("accepts slug with hyphens and numbers", () => {
    const result = CreateWorkspaceSchema.safeParse({
      name: "Test",
      slug: "my-workspace-123",
    });
    expect(result.success).toBe(true);
  });
});

describe("InviteMemberSchema", () => {
  it("validates a correct invite with userId", () => {
    const result = InviteMemberSchema.safeParse({
      userId: "cm1234567890abcdef12345",
      role: "EDITOR",
    });
    expect(result.success).toBe(true);
  });

  it("accepts VIEWER role", () => {
    const result = InviteMemberSchema.safeParse({
      userId: "cm1234567890abcdef12345",
      role: "VIEWER",
    });
    expect(result.success).toBe(true);
  });

  it("rejects OWNER role", () => {
    const result = InviteMemberSchema.safeParse({
      userId: "cm1234567890abcdef12345",
      role: "OWNER",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid userId", () => {
    const result = InviteMemberSchema.safeParse({
      userId: "not-a-cuid",
      role: "VIEWER",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing userId", () => {
    const result = InviteMemberSchema.safeParse({
      role: "EDITOR",
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateMemberRoleSchema", () => {
  it("validates a correct update", () => {
    const result = UpdateMemberRoleSchema.safeParse({
      memberId: "cm1234567890abcdef12345",
      role: "EDITOR",
    });
    expect(result.success).toBe(true);
  });

  it("rejects OWNER role", () => {
    const result = UpdateMemberRoleSchema.safeParse({
      memberId: "cm1234567890abcdef12345",
      role: "OWNER",
    });
    expect(result.success).toBe(false);
  });
});
