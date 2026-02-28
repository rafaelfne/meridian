import { describe, it, expect, vi } from "vitest";
import {
  resolvePackageDeps,
  type ResolvePackageDepsDeps,
} from "./resolve-package-deps";
import type { PackageRecord } from "../types";

function buildPackage(overrides: Partial<PackageRecord> = {}): PackageRecord {
  return {
    name: "@company/shared-lib",
    scope: "INTERNAL",
    systemId: "system-1",
    ...overrides,
  };
}

function buildDeps(
  overrides: Partial<ResolvePackageDepsDeps> = {},
): ResolvePackageDepsDeps {
  return {
    getAllPackages: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("resolvePackageDeps", () => {
  describe("SHARED_PACKAGE", () => {
    it("detects a shared internal package across 2 systems", async () => {
      const deps = buildDeps({
        getAllPackages: vi.fn().mockResolvedValue([
          buildPackage({ name: "@company/utils", scope: "INTERNAL", systemId: "sys-a" }),
          buildPackage({ name: "@company/utils", scope: "INTERNAL", systemId: "sys-b" }),
        ]),
      });

      const results = await resolvePackageDeps(deps);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        sourceId: "sys-a",
        targetId: "sys-b",
        type: "SHARED_PACKAGE",
        label: "@company/utils",
      });
    });

    it("creates pair-wise dependencies when 3 systems share a package", async () => {
      const deps = buildDeps({
        getAllPackages: vi.fn().mockResolvedValue([
          buildPackage({ name: "@company/core", scope: "INTERNAL", systemId: "sys-a" }),
          buildPackage({ name: "@company/core", scope: "INTERNAL", systemId: "sys-b" }),
          buildPackage({ name: "@company/core", scope: "INTERNAL", systemId: "sys-c" }),
        ]),
      });

      const results = await resolvePackageDeps(deps);

      expect(results).toHaveLength(3);
      const pairs = results.map((r) => `${r.sourceId}->${r.targetId}`);
      expect(pairs).toContain("sys-a->sys-b");
      expect(pairs).toContain("sys-a->sys-c");
      expect(pairs).toContain("sys-b->sys-c");
      for (const r of results) {
        expect(r.type).toBe("SHARED_PACKAGE");
        expect(r.label).toBe("@company/core");
      }
    });

    it("ignores OPEN_SOURCE packages", async () => {
      const deps = buildDeps({
        getAllPackages: vi.fn().mockResolvedValue([
          buildPackage({ name: "lodash", scope: "OPEN_SOURCE", systemId: "sys-a" }),
          buildPackage({ name: "lodash", scope: "OPEN_SOURCE", systemId: "sys-b" }),
        ]),
      });

      const results = await resolvePackageDeps(deps);

      expect(results).toHaveLength(0);
    });

    it("ignores TEST packages", async () => {
      const deps = buildDeps({
        getAllPackages: vi.fn().mockResolvedValue([
          buildPackage({ name: "@company/test-utils", scope: "TEST", systemId: "sys-a" }),
          buildPackage({ name: "@company/test-utils", scope: "TEST", systemId: "sys-b" }),
        ]),
      });

      const results = await resolvePackageDeps(deps);

      expect(results).toHaveLength(0);
    });

    it("does not create dependency when only one system uses an internal package", async () => {
      const deps = buildDeps({
        getAllPackages: vi.fn().mockResolvedValue([
          buildPackage({ name: "@company/solo", scope: "INTERNAL", systemId: "sys-a" }),
        ]),
      });

      const results = await resolvePackageDeps(deps);

      expect(results).toHaveLength(0);
    });

    it("handles multiple distinct shared internal packages", async () => {
      const deps = buildDeps({
        getAllPackages: vi.fn().mockResolvedValue([
          buildPackage({ name: "@company/auth", scope: "INTERNAL", systemId: "sys-a" }),
          buildPackage({ name: "@company/auth", scope: "INTERNAL", systemId: "sys-b" }),
          buildPackage({ name: "@company/logging", scope: "INTERNAL", systemId: "sys-c" }),
          buildPackage({ name: "@company/logging", scope: "INTERNAL", systemId: "sys-d" }),
        ]),
      });

      const results = await resolvePackageDeps(deps);

      expect(results).toHaveLength(2);
      expect(results.find((r) => r.label === "@company/auth")).toBeDefined();
      expect(results.find((r) => r.label === "@company/logging")).toBeDefined();
    });

    it("only considers INTERNAL packages when mixed scopes exist", async () => {
      const deps = buildDeps({
        getAllPackages: vi.fn().mockResolvedValue([
          buildPackage({ name: "@company/shared", scope: "INTERNAL", systemId: "sys-a" }),
          buildPackage({ name: "@company/shared", scope: "INTERNAL", systemId: "sys-b" }),
          buildPackage({ name: "express", scope: "OPEN_SOURCE", systemId: "sys-a" }),
          buildPackage({ name: "express", scope: "OPEN_SOURCE", systemId: "sys-b" }),
          buildPackage({ name: "jest", scope: "TEST", systemId: "sys-a" }),
          buildPackage({ name: "jest", scope: "TEST", systemId: "sys-b" }),
        ]),
      });

      const results = await resolvePackageDeps(deps);

      expect(results).toHaveLength(1);
      expect(results[0]!.label).toBe("@company/shared");
      expect(results[0]!.type).toBe("SHARED_PACKAGE");
    });
  });

  describe("edge cases", () => {
    it("returns empty results for empty inputs", async () => {
      const deps = buildDeps();

      const results = await resolvePackageDeps(deps);

      expect(results).toEqual([]);
      expect(deps.getAllPackages).toHaveBeenCalledTimes(1);
    });

    it("deduplicates when the same system has duplicate package entries", async () => {
      const deps = buildDeps({
        getAllPackages: vi.fn().mockResolvedValue([
          buildPackage({ name: "@company/dup", scope: "INTERNAL", systemId: "sys-a" }),
          buildPackage({ name: "@company/dup", scope: "INTERNAL", systemId: "sys-a" }),
          buildPackage({ name: "@company/dup", scope: "INTERNAL", systemId: "sys-b" }),
        ]),
      });

      const results = await resolvePackageDeps(deps);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        sourceId: "sys-a",
        targetId: "sys-b",
        type: "SHARED_PACKAGE",
        label: "@company/dup",
      });
    });
  });
});
