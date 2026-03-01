import { describe, it, expect } from "vitest";
import { CreateDocumentSchema, UpdateDocumentSchema } from "./document-schema";

describe("CreateDocumentSchema", () => {
  it("validates a correct document", () => {
    const result = CreateDocumentSchema.safeParse({
      title: "Getting Started",
      slug: "getting-started",
      content: "# Hello",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = CreateDocumentSchema.safeParse({
      title: "",
      slug: "test",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 chars", () => {
    const result = CreateDocumentSchema.safeParse({
      title: "a".repeat(201),
      slug: "test",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug format", () => {
    const result = CreateDocumentSchema.safeParse({
      title: "Test",
      slug: "Invalid Slug!",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid slug with hyphens and numbers", () => {
    const result = CreateDocumentSchema.safeParse({
      title: "Test",
      slug: "my-doc-123",
      content: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects slug with uppercase letters", () => {
    const result = CreateDocumentSchema.safeParse({
      title: "Test",
      slug: "My-Doc",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("defaults content to empty string", () => {
    const result = CreateDocumentSchema.safeParse({
      title: "Test",
      slug: "test",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe("");
    }
  });
});

describe("UpdateDocumentSchema", () => {
  it("validates content field", () => {
    const result = UpdateDocumentSchema.safeParse({
      content: "# Updated content",
    });
    expect(result.success).toBe(true);
  });

  it("allows optional title", () => {
    const result = UpdateDocumentSchema.safeParse({
      title: "New Title",
      content: "content",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing content", () => {
    const result = UpdateDocumentSchema.safeParse({
      title: "Title",
    });
    expect(result.success).toBe(false);
  });
});
