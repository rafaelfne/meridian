import { describe, it, expect, vi } from "vitest";
import { resolveHttpDependencies } from "./resolve-http-deps";
import type { Integration, System } from "../types";

function buildIntegration(overrides: Partial<Integration> = {}): Integration {
  return {
    id: "int-1",
    name: "My HTTP Integration",
    type: "HTTP_API",
    targetSystem: "target-system",
    url: "https://api.example.com",
    protocol: "REST",
    systemId: "source-system-id",
    ...overrides,
  };
}

function buildSystem(overrides: Partial<System> = {}): System {
  return {
    id: "target-system-id",
    slug: "target-system",
    name: "Target System",
    ...overrides,
  };
}

describe("resolveHttpDependencies", () => {
  it("resolves an HTTP_API integration into a dependency", async () => {
    const getAllIntegrations = vi.fn().mockResolvedValue([buildIntegration()]);
    const getSystemBySlug = vi.fn().mockResolvedValue(buildSystem());

    const result = await resolveHttpDependencies(getAllIntegrations, getSystemBySlug);

    expect(result.resolved).toHaveLength(1);
    expect(result.resolved[0]).toEqual({
      sourceId: "source-system-id",
      targetId: "target-system-id",
      type: "HTTP_API",
      label: "My HTTP Integration",
      metadata: { url: "https://api.example.com" },
    });
    expect(result.unresolved).toEqual([]);
  });

  it("filters out non-HTTP_API integrations", async () => {
    const integrations = [
      buildIntegration({ id: "int-http", type: "HTTP_API" }),
      buildIntegration({ id: "int-grpc", type: "GRPC" }),
      buildIntegration({ id: "int-db", type: "DATABASE_DIRECT" }),
    ];
    const getAllIntegrations = vi.fn().mockResolvedValue(integrations);
    const getSystemBySlug = vi.fn().mockResolvedValue(buildSystem());

    const result = await resolveHttpDependencies(getAllIntegrations, getSystemBySlug);

    expect(result.resolved).toHaveLength(1);
    expect(result.resolved[0]!.sourceId).toBe("source-system-id");
    expect(getSystemBySlug).toHaveBeenCalledTimes(1);
  });

  it("marks integration as unresolved when targetSystem is null", async () => {
    const getAllIntegrations = vi.fn().mockResolvedValue([
      buildIntegration({ id: "int-no-target", targetSystem: null }),
    ]);
    const getSystemBySlug = vi.fn();

    const result = await resolveHttpDependencies(getAllIntegrations, getSystemBySlug);

    expect(result.resolved).toEqual([]);
    expect(result.unresolved).toHaveLength(1);
    expect(result.unresolved[0]).toEqual({
      integrationId: "int-no-target",
      integrationName: "My HTTP Integration",
      sourceSystemId: "source-system-id",
      targetSystemSlug: null,
      reason: "Missing targetSystem slug",
    });
    expect(getSystemBySlug).not.toHaveBeenCalled();
  });

  it("marks integration as unresolved when target system is not found", async () => {
    const getAllIntegrations = vi.fn().mockResolvedValue([
      buildIntegration({ id: "int-missing", targetSystem: "nonexistent-system" }),
    ]);
    const getSystemBySlug = vi.fn().mockResolvedValue(null);

    const result = await resolveHttpDependencies(getAllIntegrations, getSystemBySlug);

    expect(result.resolved).toEqual([]);
    expect(result.unresolved).toHaveLength(1);
    expect(result.unresolved[0]).toEqual({
      integrationId: "int-missing",
      integrationName: "My HTTP Integration",
      sourceSystemId: "source-system-id",
      targetSystemSlug: "nonexistent-system",
      reason: 'Target system "nonexistent-system" not found',
    });
  });

  it("handles a mix of resolved and unresolved integrations", async () => {
    const integrations = [
      buildIntegration({ id: "int-1", name: "Service A", targetSystem: "system-a", systemId: "src-1" }),
      buildIntegration({ id: "int-2", name: "Service B", targetSystem: null, systemId: "src-2" }),
      buildIntegration({ id: "int-3", name: "Service C", targetSystem: "system-c", systemId: "src-3" }),
    ];
    const getAllIntegrations = vi.fn().mockResolvedValue(integrations);
    const getSystemBySlug = vi
      .fn()
      .mockImplementation(async (slug: string) => {
        if (slug === "system-a") return buildSystem({ id: "id-a", slug: "system-a" });
        return null;
      });

    const result = await resolveHttpDependencies(getAllIntegrations, getSystemBySlug);

    expect(result.resolved).toHaveLength(1);
    expect(result.resolved[0]!.targetId).toBe("id-a");

    expect(result.unresolved).toHaveLength(2);
    expect(result.unresolved[0]!.integrationId).toBe("int-2");
    expect(result.unresolved[1]!.integrationId).toBe("int-3");
  });

  it("returns empty results when no integrations exist", async () => {
    const getAllIntegrations = vi.fn().mockResolvedValue([]);
    const getSystemBySlug = vi.fn();

    const result = await resolveHttpDependencies(getAllIntegrations, getSystemBySlug);

    expect(result.resolved).toEqual([]);
    expect(result.unresolved).toEqual([]);
    expect(getSystemBySlug).not.toHaveBeenCalled();
  });

  it("returns empty results when no HTTP_API integrations exist", async () => {
    const getAllIntegrations = vi.fn().mockResolvedValue([
      buildIntegration({ type: "GRPC" }),
      buildIntegration({ type: "DATABASE_DIRECT" }),
    ]);
    const getSystemBySlug = vi.fn();

    const result = await resolveHttpDependencies(getAllIntegrations, getSystemBySlug);

    expect(result.resolved).toEqual([]);
    expect(result.unresolved).toEqual([]);
    expect(getSystemBySlug).not.toHaveBeenCalled();
  });

  it("sets metadata to null when integration has no url", async () => {
    const getAllIntegrations = vi.fn().mockResolvedValue([
      buildIntegration({ url: null }),
    ]);
    const getSystemBySlug = vi.fn().mockResolvedValue(buildSystem());

    const result = await resolveHttpDependencies(getAllIntegrations, getSystemBySlug);

    expect(result.resolved).toHaveLength(1);
    expect(result.resolved[0]!.metadata).toBeNull();
  });

  it("calls getSystemBySlug with the correct slug for each integration", async () => {
    const integrations = [
      buildIntegration({ id: "int-1", targetSystem: "slug-a", systemId: "src-1" }),
      buildIntegration({ id: "int-2", targetSystem: "slug-b", systemId: "src-2" }),
    ];
    const getAllIntegrations = vi.fn().mockResolvedValue(integrations);
    const getSystemBySlug = vi.fn().mockResolvedValue(buildSystem());

    await resolveHttpDependencies(getAllIntegrations, getSystemBySlug);

    expect(getSystemBySlug).toHaveBeenCalledWith("slug-a");
    expect(getSystemBySlug).toHaveBeenCalledWith("slug-b");
    expect(getSystemBySlug).toHaveBeenCalledTimes(2);
  });
});
