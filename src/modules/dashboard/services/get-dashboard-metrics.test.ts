import { describe, it, expect, vi } from "vitest";
import { getDashboardMetrics } from "./get-dashboard-metrics";

function buildSystem(
  overrides: Partial<{
    id: string;
    name: string;
    slug: string;
    language: string | null;
  }> = {},
) {
  return {
    id: "sys-1",
    name: "System One",
    slug: "system-one",
    language: "TypeScript",
    ...overrides,
  };
}

function buildDependency(
  overrides: Partial<{ sourceId: string; targetId: string; type: string }> = {},
) {
  return {
    sourceId: "sys-1",
    targetId: "sys-2",
    type: "HTTP_API",
    ...overrides,
  };
}

function buildRisk(
  overrides: Partial<{
    id: string;
    title: string;
    severity: string;
    system: { name: string };
  }> = {},
) {
  return {
    id: "risk-1",
    title: "Security vulnerability",
    severity: "HIGH",
    system: { name: "System One" },
    ...overrides,
  };
}

function buildUpload(
  overrides: Partial<{
    id: string;
    filename: string;
    status: string;
    systemsCount: number;
    createdAt: Date;
  }> = {},
) {
  return {
    id: "upload-1",
    filename: "inventory.json",
    status: "COMPLETED",
    systemsCount: 3,
    createdAt: new Date("2024-01-15"),
    ...overrides,
  };
}

describe("getDashboardMetrics", () => {
  it("returns complete metrics when all data is present", async () => {
    const systems = [
      buildSystem({ id: "sys-1", name: "API Gateway", slug: "api-gateway", language: "TypeScript" }),
      buildSystem({ id: "sys-2", name: "Auth Service", slug: "auth-service", language: "TypeScript" }),
      buildSystem({ id: "sys-3", name: "Data Pipeline", slug: "data-pipeline", language: "Python" }),
    ];
    const dependencies = [
      buildDependency({ sourceId: "sys-1", targetId: "sys-2", type: "HTTP_API" }),
      buildDependency({ sourceId: "sys-1", targetId: "sys-3", type: "KAFKA_TOPIC" }),
      buildDependency({ sourceId: "sys-2", targetId: "sys-3", type: "HTTP_API" }),
    ];
    const risks = [
      buildRisk({ id: "r1", title: "SQL Injection", severity: "CRITICAL", system: { name: "Auth Service" } }),
      buildRisk({ id: "r2", title: "Outdated deps", severity: "HIGH", system: { name: "API Gateway" } }),
    ];
    const uploads = [
      buildUpload({ id: "u1", filename: "inv-1.json", systemsCount: 3 }),
    ];

    const result = await getDashboardMetrics(
      vi.fn().mockResolvedValue(2),
      vi.fn().mockResolvedValue(systems),
      vi.fn().mockResolvedValue(dependencies),
      vi.fn().mockResolvedValue(risks),
      vi.fn().mockResolvedValue(uploads),
    );

    expect(result.counts).toEqual({
      domains: 2,
      systems: 3,
      dependencies: 3,
      highCriticalRisks: 2,
    });

    expect(result.languageDistribution).toEqual([
      { language: "TypeScript", count: 2 },
      { language: "Python", count: 1 },
    ]);

    expect(result.dependenciesByType).toEqual([
      { type: "HTTP_API", count: 2 },
      { type: "KAFKA_TOPIC", count: 1 },
    ]);

    // sys-1 has 2 outbound, sys-3 has 2 inbound, sys-2 has 1 inbound + 1 outbound
    expect(result.topConnectedSystems).toHaveLength(3);
    expect(result.topConnectedSystems[0]!.connectionCount).toBeGreaterThanOrEqual(
      result.topConnectedSystems[1]!.connectionCount,
    );

    expect(result.recentRisks).toEqual([
      { id: "r1", title: "SQL Injection", severity: "CRITICAL", systemName: "Auth Service" },
      { id: "r2", title: "Outdated deps", severity: "HIGH", systemName: "API Gateway" },
    ]);

    expect(result.recentUploads).toEqual([
      {
        id: "u1",
        filename: "inv-1.json",
        status: "COMPLETED",
        systemsCount: 3,
        createdAt: new Date("2024-01-15"),
      },
    ]);
  });

  it("returns empty metrics when no data exists", async () => {
    const result = await getDashboardMetrics(
      vi.fn().mockResolvedValue(0),
      vi.fn().mockResolvedValue([]),
      vi.fn().mockResolvedValue([]),
      vi.fn().mockResolvedValue([]),
      vi.fn().mockResolvedValue([]),
    );

    expect(result.counts).toEqual({
      domains: 0,
      systems: 0,
      dependencies: 0,
      highCriticalRisks: 0,
    });
    expect(result.languageDistribution).toEqual([]);
    expect(result.dependenciesByType).toEqual([]);
    expect(result.topConnectedSystems).toEqual([]);
    expect(result.recentRisks).toEqual([]);
    expect(result.recentUploads).toEqual([]);
  });

  it("groups systems without a language as Unknown", async () => {
    const systems = [
      buildSystem({ id: "sys-1", language: null }),
      buildSystem({ id: "sys-2", language: null }),
      buildSystem({ id: "sys-3", language: "Go" }),
    ];

    const result = await getDashboardMetrics(
      vi.fn().mockResolvedValue(1),
      vi.fn().mockResolvedValue(systems),
      vi.fn().mockResolvedValue([]),
      vi.fn().mockResolvedValue([]),
      vi.fn().mockResolvedValue([]),
    );

    expect(result.languageDistribution).toEqual([
      { language: "Unknown", count: 2 },
      { language: "Go", count: 1 },
    ]);
  });

  it("orders top connected systems by connection count descending", async () => {
    const systems = [
      buildSystem({ id: "s1", name: "A", slug: "a" }),
      buildSystem({ id: "s2", name: "B", slug: "b" }),
      buildSystem({ id: "s3", name: "C", slug: "c" }),
    ];
    // s1 -> s2, s1 -> s3, s2 -> s3
    // s1: 2 out = 2, s2: 1 in + 1 out = 2, s3: 2 in = 2
    const dependencies = [
      buildDependency({ sourceId: "s1", targetId: "s2" }),
      buildDependency({ sourceId: "s1", targetId: "s3" }),
      buildDependency({ sourceId: "s2", targetId: "s3" }),
    ];

    const result = await getDashboardMetrics(
      vi.fn().mockResolvedValue(1),
      vi.fn().mockResolvedValue(systems),
      vi.fn().mockResolvedValue(dependencies),
      vi.fn().mockResolvedValue([]),
      vi.fn().mockResolvedValue([]),
    );

    expect(result.topConnectedSystems).toHaveLength(3);
    // All have 2 connections
    for (const sys of result.topConnectedSystems) {
      expect(sys.connectionCount).toBe(2);
    }
  });

  it("limits top connected systems to 5", async () => {
    const systems = Array.from({ length: 7 }, (_, i) =>
      buildSystem({ id: `s${i}`, name: `System ${i}`, slug: `system-${i}` }),
    );
    // Create dependencies so each system has at least one connection
    const dependencies = Array.from({ length: 7 }, (_, i) =>
      buildDependency({ sourceId: `s${i}`, targetId: `s${(i + 1) % 7}` }),
    );

    const result = await getDashboardMetrics(
      vi.fn().mockResolvedValue(1),
      vi.fn().mockResolvedValue(systems),
      vi.fn().mockResolvedValue(dependencies),
      vi.fn().mockResolvedValue([]),
      vi.fn().mockResolvedValue([]),
    );

    expect(result.topConnectedSystems).toHaveLength(5);
  });

  it("limits recent risks to 5", async () => {
    const risks = Array.from({ length: 8 }, (_, i) =>
      buildRisk({ id: `r${i}`, title: `Risk ${i}` }),
    );

    const result = await getDashboardMetrics(
      vi.fn().mockResolvedValue(0),
      vi.fn().mockResolvedValue([]),
      vi.fn().mockResolvedValue([]),
      vi.fn().mockResolvedValue(risks),
      vi.fn().mockResolvedValue([]),
    );

    expect(result.recentRisks).toHaveLength(5);
  });

  it("limits recent uploads to 5", async () => {
    const uploads = Array.from({ length: 8 }, (_, i) =>
      buildUpload({ id: `u${i}`, filename: `file-${i}.json` }),
    );

    const result = await getDashboardMetrics(
      vi.fn().mockResolvedValue(0),
      vi.fn().mockResolvedValue([]),
      vi.fn().mockResolvedValue([]),
      vi.fn().mockResolvedValue([]),
      vi.fn().mockResolvedValue(uploads),
    );

    expect(result.recentUploads).toHaveLength(5);
  });

  it("handles systems with dependencies referencing unknown system IDs", async () => {
    const systems = [buildSystem({ id: "s1", name: "Known", slug: "known" })];
    // Dependency references a system not in the systems list
    const dependencies = [
      buildDependency({ sourceId: "s1", targetId: "unknown-id" }),
    ];

    const result = await getDashboardMetrics(
      vi.fn().mockResolvedValue(1),
      vi.fn().mockResolvedValue(systems),
      vi.fn().mockResolvedValue(dependencies),
      vi.fn().mockResolvedValue([]),
      vi.fn().mockResolvedValue([]),
    );

    // s1 has 1 connection, unknown-id is filtered out of topConnected
    expect(result.topConnectedSystems).toHaveLength(1);
    expect(result.topConnectedSystems[0]!.name).toBe("Known");
    expect(result.topConnectedSystems[0]!.connectionCount).toBe(1);
    expect(result.counts.dependencies).toBe(1);
  });

  it("sorts language distribution by count descending", async () => {
    const systems = [
      buildSystem({ id: "s1", language: "Go" }),
      buildSystem({ id: "s2", language: "Python" }),
      buildSystem({ id: "s3", language: "Python" }),
      buildSystem({ id: "s4", language: "Python" }),
      buildSystem({ id: "s5", language: "Go" }),
      buildSystem({ id: "s6", language: "Rust" }),
    ];

    const result = await getDashboardMetrics(
      vi.fn().mockResolvedValue(1),
      vi.fn().mockResolvedValue(systems),
      vi.fn().mockResolvedValue([]),
      vi.fn().mockResolvedValue([]),
      vi.fn().mockResolvedValue([]),
    );

    expect(result.languageDistribution).toEqual([
      { language: "Python", count: 3 },
      { language: "Go", count: 2 },
      { language: "Rust", count: 1 },
    ]);
  });

  it("sorts dependencies by type count descending", async () => {
    const dependencies = [
      buildDependency({ sourceId: "s1", targetId: "s2", type: "KAFKA_TOPIC" }),
      buildDependency({ sourceId: "s2", targetId: "s3", type: "HTTP_API" }),
      buildDependency({ sourceId: "s3", targetId: "s1", type: "HTTP_API" }),
      buildDependency({ sourceId: "s1", targetId: "s3", type: "HTTP_API" }),
      buildDependency({ sourceId: "s2", targetId: "s1", type: "KAFKA_TOPIC" }),
    ];

    const result = await getDashboardMetrics(
      vi.fn().mockResolvedValue(0),
      vi.fn().mockResolvedValue([]),
      vi.fn().mockResolvedValue(dependencies),
      vi.fn().mockResolvedValue([]),
      vi.fn().mockResolvedValue([]),
    );

    expect(result.dependenciesByType).toEqual([
      { type: "HTTP_API", count: 3 },
      { type: "KAFKA_TOPIC", count: 2 },
    ]);
  });
});
