import { describe, it, expect, vi } from "vitest";
import { processDependencies } from "./dependency-processor";
import type { DependencyProcessorDeps } from "../types";

function buildDeps(
  overrides: Partial<DependencyProcessorDeps> = {},
): DependencyProcessorDeps {
  return {
    getAllIntegrations: vi.fn().mockResolvedValue([]),
    getSystemBySlug: vi.fn().mockResolvedValue(null),
    getAllKafkaTopics: vi.fn().mockResolvedValue([]),
    getAllDatabases: vi.fn().mockResolvedValue([]),
    replaceAllDependencies: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("processDependencies", () => {
  it("resolves HTTP_API integrations to dependencies", async () => {
    const deps = buildDeps({
      getAllIntegrations: vi.fn().mockResolvedValue([
        { systemId: "sys-a", targetSystem: "sys-b", type: "HTTP_API" },
      ]),
      getSystemBySlug: vi.fn().mockResolvedValue({ id: "sys-b-id" }),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(1);
    expect(result.byType["HTTP_API"]).toBe(1);
    expect(deps.replaceAllDependencies).toHaveBeenCalledWith([
      { sourceId: "sys-a", targetId: "sys-b-id", type: "HTTP_API" },
    ]);
  });

  it("resolves GRPC integrations", async () => {
    const deps = buildDeps({
      getAllIntegrations: vi.fn().mockResolvedValue([
        { systemId: "sys-a", targetSystem: "sys-b", type: "GRPC" },
      ]),
      getSystemBySlug: vi.fn().mockResolvedValue({ id: "sys-b-id" }),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(1);
    expect(result.byType["GRPC"]).toBe(1);
  });

  it("maps DATABASE_DIRECT to CROSS_DATABASE_QUERY", async () => {
    const deps = buildDeps({
      getAllIntegrations: vi.fn().mockResolvedValue([
        {
          systemId: "sys-a",
          targetSystem: "sys-b",
          type: "DATABASE_DIRECT",
        },
      ]),
      getSystemBySlug: vi.fn().mockResolvedValue({ id: "sys-b-id" }),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(1);
    expect(result.byType["CROSS_DATABASE_QUERY"]).toBe(1);
  });

  it("maps FILE_TRANSFER to FILE_DEPENDENCY", async () => {
    const deps = buildDeps({
      getAllIntegrations: vi.fn().mockResolvedValue([
        {
          systemId: "sys-a",
          targetSystem: "sys-b",
          type: "FILE_TRANSFER",
        },
      ]),
      getSystemBySlug: vi.fn().mockResolvedValue({ id: "sys-b-id" }),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(1);
    expect(result.byType["FILE_DEPENDENCY"]).toBe(1);
  });

  it("maps GRAPHQL and SOAP to HTTP_API", async () => {
    const deps = buildDeps({
      getAllIntegrations: vi.fn().mockResolvedValue([
        { systemId: "sys-a", targetSystem: "sys-b", type: "GRAPHQL" },
        { systemId: "sys-c", targetSystem: "sys-d", type: "SOAP" },
      ]),
      getSystemBySlug: vi
        .fn()
        .mockResolvedValueOnce({ id: "sys-b-id" })
        .mockResolvedValueOnce({ id: "sys-d-id" }),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(2);
    expect(result.byType["HTTP_API"]).toBe(2);
  });

  it("skips OTHER integration types and counts as unresolved", async () => {
    const deps = buildDeps({
      getAllIntegrations: vi.fn().mockResolvedValue([
        { systemId: "sys-a", targetSystem: "sys-b", type: "OTHER" },
      ]),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(0);
    expect(result.unresolved).toBe(1);
  });

  it("counts unresolved when target system not found", async () => {
    const deps = buildDeps({
      getAllIntegrations: vi.fn().mockResolvedValue([
        { systemId: "sys-a", targetSystem: "missing-system", type: "HTTP_API" },
      ]),
      getSystemBySlug: vi.fn().mockResolvedValue(null),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(0);
    expect(result.unresolved).toBe(1);
  });

  it("counts unresolved when targetSystem is null", async () => {
    const deps = buildDeps({
      getAllIntegrations: vi.fn().mockResolvedValue([
        { systemId: "sys-a", targetSystem: null, type: "HTTP_API" },
      ]),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(0);
    expect(result.unresolved).toBe(1);
  });

  it("skips self-dependencies from integrations", async () => {
    const deps = buildDeps({
      getAllIntegrations: vi.fn().mockResolvedValue([
        { systemId: "sys-a", targetSystem: "sys-a-slug", type: "HTTP_API" },
      ]),
      getSystemBySlug: vi.fn().mockResolvedValue({ id: "sys-a" }),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(0);
    expect(result.unresolved).toBe(0);
  });

  it("resolves kafka producer→consumer pairs", async () => {
    const deps = buildDeps({
      getAllKafkaTopics: vi.fn().mockResolvedValue([
        { systemId: "sys-a", name: "order-events", role: "PRODUCER" },
        { systemId: "sys-b", name: "order-events", role: "CONSUMER" },
      ]),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(1);
    expect(result.byType["KAFKA_TOPIC"]).toBe(1);
    expect(deps.replaceAllDependencies).toHaveBeenCalledWith([
      {
        sourceId: "sys-a",
        targetId: "sys-b",
        type: "KAFKA_TOPIC",
        label: "order-events",
      },
    ]);
  });

  it("handles BOTH kafka role as producer and consumer", async () => {
    const deps = buildDeps({
      getAllKafkaTopics: vi.fn().mockResolvedValue([
        { systemId: "sys-a", name: "events", role: "BOTH" },
        { systemId: "sys-b", name: "events", role: "CONSUMER" },
        { systemId: "sys-c", name: "events", role: "PRODUCER" },
      ]),
    });

    const result = await processDependencies(deps);

    // sys-a (producer) → sys-b (consumer)
    // sys-a (producer) → sys-a (consumer) → skipped (self)
    // sys-c (producer) → sys-b (consumer)
    // sys-c (producer) → sys-a (consumer)
    expect(result.total).toBe(3);
    expect(result.byType["KAFKA_TOPIC"]).toBe(3);
  });

  it("skips self-dependencies from kafka topics", async () => {
    const deps = buildDeps({
      getAllKafkaTopics: vi.fn().mockResolvedValue([
        { systemId: "sys-a", name: "events", role: "PRODUCER" },
        { systemId: "sys-a", name: "events", role: "CONSUMER" },
      ]),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(0);
  });

  it("resolves shared databases between systems", async () => {
    const deps = buildDeps({
      getAllDatabases: vi.fn().mockResolvedValue([
        { systemId: "sys-a", name: "shared-db", provider: "POSTGRESQL" },
        { systemId: "sys-b", name: "shared-db", provider: "POSTGRESQL" },
      ]),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(1);
    expect(result.byType["SHARED_DATABASE"]).toBe(1);

    const calledWith = (
      deps.replaceAllDependencies as ReturnType<typeof vi.fn>
    ).mock.calls[0]![0] as Array<{
      sourceId: string;
      targetId: string;
      type: string;
      label: string;
    }>;
    const dbDep = calledWith[0]!;
    expect(dbDep.type).toBe("SHARED_DATABASE");
    expect(dbDep.label).toBe("shared-db");
    // Deterministic ordering: sourceId < targetId
    expect(dbDep.sourceId < dbDep.targetId).toBe(true);
  });

  it("does not create shared database deps for single-system databases", async () => {
    const deps = buildDeps({
      getAllDatabases: vi.fn().mockResolvedValue([
        { systemId: "sys-a", name: "private-db", provider: "POSTGRESQL" },
      ]),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(0);
  });

  it("does not create shared database deps for same name different provider", async () => {
    const deps = buildDeps({
      getAllDatabases: vi.fn().mockResolvedValue([
        { systemId: "sys-a", name: "shared-db", provider: "POSTGRESQL" },
        { systemId: "sys-b", name: "shared-db", provider: "MYSQL" },
      ]),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(0);
  });

  it("deduplicates dependencies", async () => {
    const deps = buildDeps({
      getAllIntegrations: vi.fn().mockResolvedValue([
        { systemId: "sys-a", targetSystem: "sys-b", type: "HTTP_API" },
        { systemId: "sys-a", targetSystem: "sys-b", type: "HTTP_API" },
      ]),
      getSystemBySlug: vi.fn().mockResolvedValue({ id: "sys-b-id" }),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(1);
  });

  it("returns correct byType counts", async () => {
    const deps = buildDeps({
      getAllIntegrations: vi.fn().mockResolvedValue([
        { systemId: "sys-a", targetSystem: "sys-b", type: "HTTP_API" },
        { systemId: "sys-c", targetSystem: "sys-d", type: "GRPC" },
      ]),
      getSystemBySlug: vi
        .fn()
        .mockResolvedValueOnce({ id: "sys-b-id" })
        .mockResolvedValueOnce({ id: "sys-d-id" }),
      getAllKafkaTopics: vi.fn().mockResolvedValue([
        { systemId: "sys-e", name: "events", role: "PRODUCER" },
        { systemId: "sys-f", name: "events", role: "CONSUMER" },
      ]),
    });

    const result = await processDependencies(deps);

    expect(result.byType).toEqual({
      HTTP_API: 1,
      GRPC: 1,
      KAFKA_TOPIC: 1,
    });
    expect(result.total).toBe(3);
  });

  it("returns correct total", async () => {
    const deps = buildDeps({
      getAllIntegrations: vi.fn().mockResolvedValue([
        { systemId: "sys-a", targetSystem: "sys-b", type: "HTTP_API" },
      ]),
      getSystemBySlug: vi.fn().mockResolvedValue({ id: "sys-b-id" }),
      getAllDatabases: vi.fn().mockResolvedValue([
        { systemId: "sys-c", name: "db", provider: "POSTGRESQL" },
        { systemId: "sys-d", name: "db", provider: "POSTGRESQL" },
      ]),
    });

    const result = await processDependencies(deps);

    expect(result.total).toBe(2);
  });

  it("handles empty data", async () => {
    const deps = buildDeps();

    const result = await processDependencies(deps);

    expect(result.total).toBe(0);
    expect(result.byType).toEqual({});
    expect(result.unresolved).toBe(0);
    expect(deps.replaceAllDependencies).toHaveBeenCalledWith([]);
  });

  it("calls replaceAllDependencies with resolved deps", async () => {
    const deps = buildDeps({
      getAllIntegrations: vi.fn().mockResolvedValue([
        { systemId: "sys-a", targetSystem: "sys-b", type: "HTTP_API" },
      ]),
      getSystemBySlug: vi.fn().mockResolvedValue({ id: "sys-b-id" }),
    });

    await processDependencies(deps);

    expect(deps.replaceAllDependencies).toHaveBeenCalledTimes(1);
    expect(deps.replaceAllDependencies).toHaveBeenCalledWith([
      { sourceId: "sys-a", targetId: "sys-b-id", type: "HTTP_API" },
    ]);
  });
});
