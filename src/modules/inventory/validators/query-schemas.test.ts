import { describe, it, expect } from "vitest";
import {
  SystemsQuerySchema,
  SystemDetailQuerySchema,
  UploadsQuerySchema,
} from "./query-schemas";

describe("SystemsQuerySchema", () => {
  it("applies defaults when no params provided", () => {
    const result = SystemsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.domain).toBeUndefined();
    }
  });

  it("parses valid query with domain filter", () => {
    const result = SystemsQuerySchema.safeParse({
      domain: "Payments",
      page: "2",
      limit: "10",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.domain).toBe("Payments");
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });

  it("coerces string numbers to integers", () => {
    const result = SystemsQuerySchema.safeParse({ page: "3", limit: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it("rejects non-positive page", () => {
    const result = SystemsQuerySchema.safeParse({ page: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive limit", () => {
    const result = SystemsQuerySchema.safeParse({ limit: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejects limit over 100", () => {
    const result = SystemsQuerySchema.safeParse({ limit: "101" });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric page", () => {
    const result = SystemsQuerySchema.safeParse({ page: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer page", () => {
    const result = SystemsQuerySchema.safeParse({ page: "1.5" });
    expect(result.success).toBe(false);
  });
});

describe("SystemDetailQuerySchema", () => {
  it("applies defaults when no params provided", () => {
    const result = SystemDetailQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBeUndefined();
    }
  });

  it("parses include parameter", () => {
    const result = SystemDetailQuerySchema.safeParse({
      include: "services,databases",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe("services,databases");
    }
  });
});

describe("UploadsQuerySchema", () => {
  it("applies defaults when no params provided", () => {
    const result = UploadsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("parses valid pagination", () => {
    const result = UploadsQuerySchema.safeParse({ page: "3", limit: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it("rejects non-positive page", () => {
    const result = UploadsQuerySchema.safeParse({ page: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects limit over 100", () => {
    const result = UploadsQuerySchema.safeParse({ limit: "200" });
    expect(result.success).toBe(false);
  });
});
