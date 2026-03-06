import { describe, it, expect } from "vitest";
import { GraphQuerySchema } from "./graph-query-schema";

describe("GraphQuerySchema", () => {
  it("accepts empty input and returns undefined for both fields", () => {
    const result = GraphQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.domain).toBeUndefined();
      expect(result.data.dependencyType).toBeUndefined();
    }
  });

  it("accepts a domain string", () => {
    const result = GraphQuerySchema.safeParse({ domain: "payments" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.domain).toBe("payments");
    }
  });

  it("parses a single valid dependency type", () => {
    const result = GraphQuerySchema.safeParse({ dependencyType: "HTTP_API" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dependencyType).toEqual(["HTTP_API"]);
    }
  });

  it("parses multiple dependency types from comma-separated string", () => {
    const result = GraphQuerySchema.safeParse({
      dependencyType: "HTTP_API,KAFKA_TOPIC,SHARED_DATABASE",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dependencyType).toEqual([
        "HTTP_API",
        "KAFKA_TOPIC",
        "SHARED_DATABASE",
      ]);
    }
  });

  it("filters out invalid dependency types from comma-separated list", () => {
    const result = GraphQuerySchema.safeParse({
      dependencyType: "HTTP_API,INVALID_TYPE,KAFKA_TOPIC",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dependencyType).toEqual(["HTTP_API", "KAFKA_TOPIC"]);
    }
  });

  it("returns undefined dependencyType when all values are invalid", () => {
    const result = GraphQuerySchema.safeParse({
      dependencyType: "INVALID_TYPE,ALSO_INVALID",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      // Empty array after filtering all invalid types
      expect(result.data.dependencyType).toEqual([]);
    }
  });

  it("handles whitespace around dependency type values", () => {
    const result = GraphQuerySchema.safeParse({
      dependencyType: " HTTP_API , KAFKA_TOPIC ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dependencyType).toEqual(["HTTP_API", "KAFKA_TOPIC"]);
    }
  });

  it("accepts all valid dependency types", () => {
    const allTypes =
      "HTTP_API,KAFKA_TOPIC,RABBITMQ_QUEUE,SQS_QUEUE,SHARED_DATABASE,CROSS_DATABASE_QUERY,SHARED_PACKAGE,GRPC,FILE_DEPENDENCY";

    const result = GraphQuerySchema.safeParse({ dependencyType: allTypes });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dependencyType).toHaveLength(9);
    }
  });

  it("returns undefined dependencyType when value is empty string", () => {
    const result = GraphQuerySchema.safeParse({ dependencyType: "" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dependencyType).toBeUndefined();
    }
  });

  it("accepts domain and dependencyType together", () => {
    const result = GraphQuerySchema.safeParse({
      domain: "payments",
      dependencyType: "HTTP_API,SHARED_DATABASE",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.domain).toBe("payments");
      expect(result.data.dependencyType).toEqual(["HTTP_API", "SHARED_DATABASE"]);
    }
  });
});
