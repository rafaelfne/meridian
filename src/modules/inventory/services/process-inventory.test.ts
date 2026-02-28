import { describe, it, expect, vi } from "vitest";
import {
  processInventory,
  DEFAULT_DOMAIN_NAME,
  type ProcessInventoryDeps,
} from "./process-inventory";
import type { SystemInventory } from "../types";

function buildSystem(overrides: Partial<SystemInventory> = {}): SystemInventory {
  return {
    name: "Test System",
    slug: "test-system",
    services: [],
    databases: [],
    integrations: [],
    kafkaTopics: [],
    packages: [],
    apiEndpoints: [],
    risks: [],
    ...overrides,
  };
}

function buildDeps(overrides: Partial<ProcessInventoryDeps> = {}): ProcessInventoryDeps {
  return {
    upsertDomain: vi.fn().mockResolvedValue({ id: "domain-1" }),
    processSystem: vi.fn().mockResolvedValue({ id: "system-1" }),
    ...overrides,
  };
}

describe("processInventory", () => {
  it("upserts the default domain", async () => {
    const deps = buildDeps();
    await processInventory([buildSystem()], deps);

    expect(deps.upsertDomain).toHaveBeenCalledWith(DEFAULT_DOMAIN_NAME);
    expect(deps.upsertDomain).toHaveBeenCalledTimes(1);
  });

  it("processes each system with the correct domain id", async () => {
    const deps = buildDeps({
      upsertDomain: vi.fn().mockResolvedValue({ id: "my-domain-id" }),
    });
    const systems = [
      buildSystem({ slug: "system-a", name: "System A" }),
      buildSystem({ slug: "system-b", name: "System B" }),
    ];

    await processInventory(systems, deps);

    expect(deps.processSystem).toHaveBeenCalledTimes(2);
    expect(deps.processSystem).toHaveBeenCalledWith("my-domain-id", systems[0]);
    expect(deps.processSystem).toHaveBeenCalledWith("my-domain-id", systems[1]);
  });

  it("returns the number of systems processed", async () => {
    const deps = buildDeps();
    const systems = [
      buildSystem({ slug: "a" }),
      buildSystem({ slug: "b" }),
      buildSystem({ slug: "c" }),
    ];

    const result = await processInventory(systems, deps);

    expect(result.systemsProcessed).toBe(3);
    expect(result.errors).toEqual([]);
  });

  it("collects errors when a system fails and continues processing", async () => {
    const processSystem = vi
      .fn()
      .mockResolvedValueOnce({ id: "s1" })
      .mockRejectedValueOnce(new Error("DB constraint violation"))
      .mockResolvedValueOnce({ id: "s3" });

    const deps = buildDeps({ processSystem });
    const systems = [
      buildSystem({ slug: "ok-1" }),
      buildSystem({ slug: "fail" }),
      buildSystem({ slug: "ok-2" }),
    ];

    const result = await processInventory(systems, deps);

    expect(result.systemsProcessed).toBe(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("fail");
    expect(result.errors[0]).toContain("DB constraint violation");
  });

  it("returns zero processed when all systems fail", async () => {
    const deps = buildDeps({
      processSystem: vi.fn().mockRejectedValue(new Error("fail")),
    });
    const systems = [buildSystem({ slug: "a" }), buildSystem({ slug: "b" })];

    const result = await processInventory(systems, deps);

    expect(result.systemsProcessed).toBe(0);
    expect(result.errors).toHaveLength(2);
  });

  it("handles non-Error thrown values", async () => {
    const deps = buildDeps({
      processSystem: vi.fn().mockRejectedValue("string error"),
    });

    const result = await processInventory([buildSystem()], deps);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("string error");
  });

  it("propagates domain upsert failure", async () => {
    const deps = buildDeps({
      upsertDomain: vi.fn().mockRejectedValue(new Error("domain error")),
    });

    await expect(
      processInventory([buildSystem()], deps),
    ).rejects.toThrow("domain error");
  });

  it("returns empty results for an empty systems array", async () => {
    const deps = buildDeps();

    const result = await processInventory([], deps);

    expect(result.systemsProcessed).toBe(0);
    expect(result.errors).toEqual([]);
    expect(deps.upsertDomain).toHaveBeenCalledTimes(1);
    expect(deps.processSystem).not.toHaveBeenCalled();
  });

  it("processes systems sequentially", async () => {
    const callOrder: string[] = [];
    const deps = buildDeps({
      processSystem: vi.fn().mockImplementation(async (_domainId, system: SystemInventory) => {
        callOrder.push(system.slug);
        return { id: system.slug };
      }),
    });
    const systems = [
      buildSystem({ slug: "first" }),
      buildSystem({ slug: "second" }),
      buildSystem({ slug: "third" }),
    ];

    await processInventory(systems, deps);

    expect(callOrder).toEqual(["first", "second", "third"]);
  });
});
