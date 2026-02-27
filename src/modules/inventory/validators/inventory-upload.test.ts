import { describe, it, expect } from "vitest";
import {
  InventoryUploadSchema,
  SystemInventorySchema,
} from "./inventory-upload";

describe("InventoryUploadSchema", () => {
  it("validates a minimal valid inventory", () => {
    const input = {
      systems: [
        {
          name: "Auth Service",
          slug: "auth-service",
        },
      ],
    };

    const result = InventoryUploadSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.systems).toHaveLength(1);
      expect(result.data.systems[0]?.name).toBe("Auth Service");
    }
  });

  it("validates a full inventory with all fields", () => {
    const input = {
      systems: [
        {
          name: "Order Service",
          slug: "order-service",
          purpose: "Handles order processing",
          language: "TypeScript",
          framework: "Next.js",
          frameworkVersion: "15.0.0",
          repositoryUrl: "https://github.com/example/order-service",
          services: [
            { name: "order-api", type: "API", port: 3000, path: "/api" },
            { name: "order-worker", type: "WORKER" },
          ],
          databases: [
            {
              name: "orders-db",
              provider: "PostgreSQL",
              version: "15",
              orm: "Prisma",
            },
          ],
          integrations: [
            {
              targetSystem: "payment-service",
              type: "HTTP_API",
              description: "Payment processing",
            },
          ],
          kafkaTopics: [{ name: "order-events", role: "PRODUCER" }],
          packages: [
            { name: "lodash", version: "4.17.21", type: "OPEN_SOURCE" },
          ],
          apiEndpoints: [
            {
              path: "/api/orders",
              method: "GET",
              description: "List orders",
            },
          ],
          risks: [
            {
              title: "High load",
              description: "May need scaling",
              severity: "MEDIUM",
            },
          ],
        },
      ],
    };

    const result = InventoryUploadSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.systems[0]?.services).toHaveLength(2);
      expect(result.data.systems[0]?.databases).toHaveLength(1);
      expect(result.data.systems[0]?.integrations).toHaveLength(1);
    }
  });

  it("rejects an empty systems array", () => {
    const input = { systems: [] };
    const result = InventoryUploadSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing systems field", () => {
    const input = {};
    const result = InventoryUploadSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects a system without a name", () => {
    const input = {
      systems: [{ slug: "test" }],
    };
    const result = InventoryUploadSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects a system without a slug", () => {
    const input = {
      systems: [{ name: "Test" }],
    };
    const result = InventoryUploadSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid service type", () => {
    const input = {
      systems: [
        {
          name: "Test",
          slug: "test",
          services: [{ name: "svc", type: "INVALID" }],
        },
      ],
    };
    const result = InventoryUploadSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid integration type", () => {
    const input = {
      systems: [
        {
          name: "Test",
          slug: "test",
          integrations: [{ targetSystem: "other", type: "INVALID" }],
        },
      ],
    };
    const result = InventoryUploadSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid risk severity", () => {
    const input = {
      systems: [
        {
          name: "Test",
          slug: "test",
          risks: [{ title: "Risk", severity: "EXTREME" }],
        },
      ],
    };
    const result = InventoryUploadSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid repository URL", () => {
    const input = {
      systems: [
        {
          name: "Test",
          slug: "test",
          repositoryUrl: "not-a-url",
        },
      ],
    };
    const result = InventoryUploadSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("defaults optional arrays to empty arrays", () => {
    const input = {
      systems: [
        {
          name: "Test",
          slug: "test",
        },
      ],
    };
    const result = InventoryUploadSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const system = result.data.systems[0]!;
      expect(system.services).toEqual([]);
      expect(system.databases).toEqual([]);
      expect(system.integrations).toEqual([]);
      expect(system.kafkaTopics).toEqual([]);
      expect(system.packages).toEqual([]);
      expect(system.apiEndpoints).toEqual([]);
      expect(system.risks).toEqual([]);
    }
  });
});

describe("SystemInventorySchema", () => {
  it("validates a minimal system", () => {
    const result = SystemInventorySchema.safeParse({
      name: "My System",
      slug: "my-system",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = SystemInventorySchema.safeParse({
      name: "",
      slug: "my-system",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty slug", () => {
    const result = SystemInventorySchema.safeParse({
      name: "My System",
      slug: "",
    });
    expect(result.success).toBe(false);
  });
});
