import { describe, it, expect, vi } from "vitest";
import {
  resolveDatabaseDeps,
  type ResolveDatabaseDepsDeps,
} from "./resolve-database-deps";
import type { DatabaseRecord, IntegrationRecord } from "../types";

function buildDatabase(overrides: Partial<DatabaseRecord> = {}): DatabaseRecord {
  return {
    name: "main-db",
    provider: "PostgreSQL",
    systemId: "system-1",
    ...overrides,
  };
}

function buildIntegration(
  overrides: Partial<IntegrationRecord> = {},
): IntegrationRecord {
  return {
    name: "db-query",
    type: "DATABASE_DIRECT",
    targetSystem: "target-system",
    systemId: "system-1",
    ...overrides,
  };
}

function buildDeps(
  overrides: Partial<ResolveDatabaseDepsDeps> = {},
): ResolveDatabaseDepsDeps {
  return {
    getAllDatabases: vi.fn().mockResolvedValue([]),
    getAllIntegrations: vi.fn().mockResolvedValue([]),
    getSystemBySlug: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe("resolveDatabaseDeps", () => {
  describe("SHARED_DATABASE", () => {
    it("detects a shared database across 2 systems", async () => {
      const deps = buildDeps({
        getAllDatabases: vi.fn().mockResolvedValue([
          buildDatabase({ name: "users-db", provider: "PostgreSQL", systemId: "sys-a" }),
          buildDatabase({ name: "users-db", provider: "PostgreSQL", systemId: "sys-b" }),
        ]),
      });

      const results = await resolveDatabaseDeps(deps);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        sourceId: "sys-a",
        targetId: "sys-b",
        type: "SHARED_DATABASE",
        label: "users-db",
      });
    });

    it("creates pair-wise dependencies when 3 systems share a database", async () => {
      const deps = buildDeps({
        getAllDatabases: vi.fn().mockResolvedValue([
          buildDatabase({ name: "shared-db", provider: "MySQL", systemId: "sys-a" }),
          buildDatabase({ name: "shared-db", provider: "MySQL", systemId: "sys-b" }),
          buildDatabase({ name: "shared-db", provider: "MySQL", systemId: "sys-c" }),
        ]),
      });

      const results = await resolveDatabaseDeps(deps);

      expect(results).toHaveLength(3);
      const pairs = results.map((r) => `${r.sourceId}->${r.targetId}`);
      expect(pairs).toContain("sys-a->sys-b");
      expect(pairs).toContain("sys-a->sys-c");
      expect(pairs).toContain("sys-b->sys-c");
      for (const r of results) {
        expect(r.type).toBe("SHARED_DATABASE");
        expect(r.label).toBe("shared-db");
      }
    });

    it("does not create dependency when same name but different provider", async () => {
      const deps = buildDeps({
        getAllDatabases: vi.fn().mockResolvedValue([
          buildDatabase({ name: "main-db", provider: "PostgreSQL", systemId: "sys-a" }),
          buildDatabase({ name: "main-db", provider: "MySQL", systemId: "sys-b" }),
        ]),
      });

      const results = await resolveDatabaseDeps(deps);

      expect(results).toHaveLength(0);
    });

    it("does not create dependency when only one system uses the database", async () => {
      const deps = buildDeps({
        getAllDatabases: vi.fn().mockResolvedValue([
          buildDatabase({ name: "solo-db", provider: "PostgreSQL", systemId: "sys-a" }),
        ]),
      });

      const results = await resolveDatabaseDeps(deps);

      expect(results).toHaveLength(0);
    });

    it("handles multiple distinct shared databases", async () => {
      const deps = buildDeps({
        getAllDatabases: vi.fn().mockResolvedValue([
          buildDatabase({ name: "db-alpha", provider: "PostgreSQL", systemId: "sys-a" }),
          buildDatabase({ name: "db-alpha", provider: "PostgreSQL", systemId: "sys-b" }),
          buildDatabase({ name: "db-beta", provider: "Redis", systemId: "sys-c" }),
          buildDatabase({ name: "db-beta", provider: "Redis", systemId: "sys-d" }),
        ]),
      });

      const results = await resolveDatabaseDeps(deps);

      expect(results).toHaveLength(2);
      expect(results.find((r) => r.label === "db-alpha")).toBeDefined();
      expect(results.find((r) => r.label === "db-beta")).toBeDefined();
    });

    it("deduplicates when the same system has duplicate database entries", async () => {
      const deps = buildDeps({
        getAllDatabases: vi.fn().mockResolvedValue([
          buildDatabase({ name: "dup-db", provider: "PostgreSQL", systemId: "sys-a" }),
          buildDatabase({ name: "dup-db", provider: "PostgreSQL", systemId: "sys-a" }),
          buildDatabase({ name: "dup-db", provider: "PostgreSQL", systemId: "sys-b" }),
        ]),
      });

      const results = await resolveDatabaseDeps(deps);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        sourceId: "sys-a",
        targetId: "sys-b",
        type: "SHARED_DATABASE",
        label: "dup-db",
      });
    });
  });

  describe("CROSS_DATABASE_QUERY", () => {
    it("creates dependency for DATABASE_DIRECT integration", async () => {
      const deps = buildDeps({
        getAllIntegrations: vi.fn().mockResolvedValue([
          buildIntegration({
            name: "read-orders",
            type: "DATABASE_DIRECT",
            targetSystem: "orders-system",
            systemId: "sys-a",
          }),
        ]),
        getSystemBySlug: vi.fn().mockResolvedValue({ id: "sys-orders" }),
      });

      const results = await resolveDatabaseDeps(deps);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        sourceId: "sys-a",
        targetId: "sys-orders",
        type: "CROSS_DATABASE_QUERY",
        label: "read-orders",
      });
      expect(deps.getSystemBySlug).toHaveBeenCalledWith("orders-system");
    });

    it("skips integration with unknown target system", async () => {
      const deps = buildDeps({
        getAllIntegrations: vi.fn().mockResolvedValue([
          buildIntegration({
            type: "DATABASE_DIRECT",
            targetSystem: "nonexistent-system",
            systemId: "sys-a",
          }),
        ]),
        getSystemBySlug: vi.fn().mockResolvedValue(null),
      });

      const results = await resolveDatabaseDeps(deps);

      expect(results).toHaveLength(0);
    });

    it("skips non-DATABASE_DIRECT integrations", async () => {
      const deps = buildDeps({
        getAllIntegrations: vi.fn().mockResolvedValue([
          buildIntegration({ type: "HTTP_API", targetSystem: "some-system", systemId: "sys-a" }),
          buildIntegration({ type: "GRPC", targetSystem: "some-system", systemId: "sys-b" }),
        ]),
        getSystemBySlug: vi.fn().mockResolvedValue({ id: "sys-target" }),
      });

      const results = await resolveDatabaseDeps(deps);

      expect(results).toHaveLength(0);
      expect(deps.getSystemBySlug).not.toHaveBeenCalled();
    });

    it("skips integration with null targetSystem", async () => {
      const deps = buildDeps({
        getAllIntegrations: vi.fn().mockResolvedValue([
          buildIntegration({ type: "DATABASE_DIRECT", targetSystem: null, systemId: "sys-a" }),
        ]),
      });

      const results = await resolveDatabaseDeps(deps);

      expect(results).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("returns empty results for empty inputs", async () => {
      const deps = buildDeps();

      const results = await resolveDatabaseDeps(deps);

      expect(results).toEqual([]);
      expect(deps.getAllDatabases).toHaveBeenCalledTimes(1);
      expect(deps.getAllIntegrations).toHaveBeenCalledTimes(1);
    });

    it("combines SHARED_DATABASE and CROSS_DATABASE_QUERY results", async () => {
      const deps = buildDeps({
        getAllDatabases: vi.fn().mockResolvedValue([
          buildDatabase({ name: "shared", provider: "PostgreSQL", systemId: "sys-a" }),
          buildDatabase({ name: "shared", provider: "PostgreSQL", systemId: "sys-b" }),
        ]),
        getAllIntegrations: vi.fn().mockResolvedValue([
          buildIntegration({
            name: "direct-query",
            type: "DATABASE_DIRECT",
            targetSystem: "target-sys",
            systemId: "sys-c",
          }),
        ]),
        getSystemBySlug: vi.fn().mockResolvedValue({ id: "sys-target" }),
      });

      const results = await resolveDatabaseDeps(deps);

      expect(results).toHaveLength(2);
      expect(results.filter((r) => r.type === "SHARED_DATABASE")).toHaveLength(1);
      expect(results.filter((r) => r.type === "CROSS_DATABASE_QUERY")).toHaveLength(1);
    });
  });
});
