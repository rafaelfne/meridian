import { describe, it, expect, vi } from "vitest";
import {
  processDependencies,
  type DependencyProcessorDeps,
  type NormalizedDependency,
} from "./dependency-processor";
import type {
  Dependency,
  DependencyResult,
  ResolvedDependency,
  ResolveHttpDepsResult,
} from "../types";

function buildHttpResult(
  overrides: Partial<ResolveHttpDepsResult> = {},
): ResolveHttpDepsResult {
  return {
    resolved: [],
    unresolved: [],
    ...overrides,
  };
}

function buildHttpDep(overrides: Partial<Dependency> = {}): Dependency {
  return {
    sourceId: "src-1",
    targetId: "tgt-1",
    type: "HTTP_API",
    label: "HTTP Dep",
    metadata: null,
    ...overrides,
  };
}

function buildDatabaseDep(
  overrides: Partial<DependencyResult> = {},
): DependencyResult {
  return {
    sourceId: "src-2",
    targetId: "tgt-2",
    type: "SHARED_DATABASE",
    label: "shared-db",
    ...overrides,
  };
}

function buildKafkaDep(
  overrides: Partial<ResolvedDependency> = {},
): ResolvedDependency {
  return {
    sourceId: "src-3",
    targetId: "tgt-3",
    type: "KAFKA_TOPIC",
    label: "orders-topic",
    ...overrides,
  };
}

function buildPackageDep(
  overrides: Partial<DependencyResult> = {},
): DependencyResult {
  return {
    sourceId: "src-4",
    targetId: "tgt-4",
    type: "SHARED_PACKAGE",
    label: "shared-utils",
    ...overrides,
  };
}

function buildDeps(
  overrides: Partial<DependencyProcessorDeps> = {},
): DependencyProcessorDeps {
  return {
    resolveHttp: vi.fn().mockResolvedValue(buildHttpResult()),
    resolveDatabase: vi.fn().mockResolvedValue([]),
    resolveKafka: vi.fn().mockResolvedValue([]),
    resolvePackage: vi.fn().mockResolvedValue([]),
    persistDependencies: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("processDependencies", () => {
  it("orchestrates all resolvers and returns correct totals", async () => {
    const deps = buildDeps({
      resolveHttp: vi
        .fn()
        .mockResolvedValue(
          buildHttpResult({ resolved: [buildHttpDep()] }),
        ),
      resolveDatabase: vi.fn().mockResolvedValue([buildDatabaseDep()]),
      resolveKafka: vi.fn().mockResolvedValue([buildKafkaDep()]),
      resolvePackage: vi.fn().mockResolvedValue([buildPackageDep()]),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(4);
    expect(deps.resolveHttp).toHaveBeenCalledTimes(1);
    expect(deps.resolveDatabase).toHaveBeenCalledTimes(1);
    expect(deps.resolveKafka).toHaveBeenCalledTimes(1);
    expect(deps.resolvePackage).toHaveBeenCalledTimes(1);
  });

  it("counts dependencies by type correctly", async () => {
    const deps = buildDeps({
      resolveHttp: vi.fn().mockResolvedValue(
        buildHttpResult({
          resolved: [
            buildHttpDep({ sourceId: "a", targetId: "b" }),
            buildHttpDep({ sourceId: "c", targetId: "d" }),
          ],
        }),
      ),
      resolveDatabase: vi.fn().mockResolvedValue([
        buildDatabaseDep({ type: "SHARED_DATABASE" }),
        buildDatabaseDep({ type: "CROSS_DATABASE_QUERY", sourceId: "e", targetId: "f" }),
      ]),
      resolveKafka: vi.fn().mockResolvedValue([buildKafkaDep()]),
      resolvePackage: vi.fn().mockResolvedValue([buildPackageDep()]),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(6);
    expect(result.byType).toEqual({
      HTTP_API: 2,
      SHARED_DATABASE: 1,
      CROSS_DATABASE_QUERY: 1,
      KAFKA_TOPIC: 1,
      SHARED_PACKAGE: 1,
    });
  });

  it("tracks unresolved count from HTTP resolver", async () => {
    const deps = buildDeps({
      resolveHttp: vi.fn().mockResolvedValue(
        buildHttpResult({
          resolved: [buildHttpDep()],
          unresolved: [
            {
              integrationId: "int-1",
              integrationName: "Missing Target",
              sourceSystemId: "src-1",
              targetSystemSlug: "unknown",
              reason: "Target system not found",
            },
            {
              integrationId: "int-2",
              integrationName: "No Target",
              sourceSystemId: "src-2",
              targetSystemSlug: null,
              reason: "Missing targetSystem slug",
            },
          ],
        }),
      ),
    });

    const result = await processDependencies(deps);

    expect(result.unresolved).toBe(2);
  });

  it("calls persistDependencies with all collected dependencies", async () => {
    const persistDependencies = vi.fn().mockResolvedValue(undefined);
    const deps = buildDeps({
      resolveHttp: vi
        .fn()
        .mockResolvedValue(
          buildHttpResult({ resolved: [buildHttpDep()] }),
        ),
      resolveDatabase: vi.fn().mockResolvedValue([buildDatabaseDep()]),
      resolveKafka: vi.fn().mockResolvedValue([buildKafkaDep()]),
      resolvePackage: vi.fn().mockResolvedValue([buildPackageDep()]),
      persistDependencies,
    });

    await processDependencies(deps);

    expect(persistDependencies).toHaveBeenCalledTimes(1);

    const persisted = persistDependencies.mock
      .calls[0]![0] as NormalizedDependency[];
    expect(persisted).toHaveLength(4);
    expect(persisted.map((d) => d.type)).toEqual([
      "HTTP_API",
      "SHARED_DATABASE",
      "KAFKA_TOPIC",
      "SHARED_PACKAGE",
    ]);
  });

  it("handles empty results from all resolvers", async () => {
    const deps = buildDeps();

    const result = await processDependencies(deps);

    expect(result.total).toBe(0);
    expect(result.byType).toEqual({});
    expect(result.unresolved).toBe(0);
    expect(deps.persistDependencies).toHaveBeenCalledWith([]);
  });

  it("propagates errors from resolvers", async () => {
    const deps = buildDeps({
      resolveDatabase: vi
        .fn()
        .mockRejectedValue(new Error("Database connection failed")),
    });

    await expect(processDependencies(deps)).rejects.toThrow(
      "Database connection failed",
    );
  });

  it("normalizes HTTP dependencies with metadata", async () => {
    const persistDependencies = vi.fn().mockResolvedValue(undefined);
    const httpDep = buildHttpDep({
      metadata: { url: "https://api.example.com" },
    });
    const deps = buildDeps({
      resolveHttp: vi
        .fn()
        .mockResolvedValue(buildHttpResult({ resolved: [httpDep] })),
      persistDependencies,
    });

    await processDependencies(deps);

    const persisted = persistDependencies.mock
      .calls[0]![0] as NormalizedDependency[];
    expect(persisted[0]!.metadata).toEqual({ url: "https://api.example.com" });
  });

  it("normalizes DependencyResult label to null when undefined", async () => {
    const persistDependencies = vi.fn().mockResolvedValue(undefined);
    const dbDep = buildDatabaseDep();
    delete (dbDep as Record<string, unknown>)["label"];

    const deps = buildDeps({
      resolveDatabase: vi.fn().mockResolvedValue([dbDep]),
      persistDependencies,
    });

    await processDependencies(deps);

    const persisted = persistDependencies.mock
      .calls[0]![0] as NormalizedDependency[];
    expect(persisted[0]!.label).toBeNull();
    expect(persisted[0]!.metadata).toBeNull();
  });
});
