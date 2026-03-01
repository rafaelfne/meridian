import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProcessDependenciesResult } from "../processors/dependency-processor";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    integration: { findMany: vi.fn() },
    system: { findUnique: vi.fn() },
    database: { findMany: vi.fn() },
    messageTopic: { findMany: vi.fn() },
    package: { findMany: vi.fn() },
    dependency: { deleteMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("../services/resolve-http-deps", () => ({
  resolveHttpDependencies: vi.fn(),
}));

vi.mock("../services/resolve-database-deps", () => ({
  resolveDatabaseDeps: vi.fn(),
}));

vi.mock("../services/resolve-messaging-deps", () => ({
  resolveMessagingDeps: vi.fn(),
}));

vi.mock("../processors/dependency-processor", async () => {
  const actual = await vi.importActual<
    typeof import("../processors/dependency-processor")
  >("../processors/dependency-processor");
  return actual;
});

describe("processDependenciesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success with data on successful processing", async () => {
    const { resolveHttpDependencies } = await import(
      "../services/resolve-http-deps"
    );
    const { resolveDatabaseDeps } = await import(
      "../services/resolve-database-deps"
    );
    const { resolveMessagingDeps } = await import(
      "../services/resolve-messaging-deps"
    );
    const { prisma } = await import("@/lib/prisma");
    const { revalidatePath } = await import("next/cache");

    vi.mocked(resolveHttpDependencies).mockResolvedValue({
      resolved: [
        {
          sourceId: "s1",
          targetId: "t1",
          type: "HTTP_API",
          label: "api",
          metadata: null,
        },
      ],
      unresolved: [],
    });
    vi.mocked(resolveDatabaseDeps).mockResolvedValue([]);
    vi.mocked(resolveMessagingDeps).mockResolvedValue([]);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      if (typeof fn === "function") {
        return fn(prisma as never);
      }
    });

    const { processDependenciesAction } = await import("./process");
    const result = await processDependenciesAction();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();

    const data = result.data as ProcessDependenciesResult;
    expect(data.total).toBe(1);
    expect(data.byType).toEqual({ HTTP_API: 1 });
    expect(data.unresolved).toBe(0);
    expect(revalidatePath).toHaveBeenCalledWith("/graph");
  });

  it("returns error on failure", async () => {
    const { resolveHttpDependencies } = await import(
      "../services/resolve-http-deps"
    );

    vi.mocked(resolveHttpDependencies).mockRejectedValue(
      new Error("Connection refused"),
    );

    const { processDependenciesAction } = await import("./process");
    const result = await processDependenciesAction();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Connection refused");
    expect(result.data).toBeUndefined();
  });

  it("calls revalidatePath with /graph on success", async () => {
    const { resolveHttpDependencies } = await import(
      "../services/resolve-http-deps"
    );
    const { resolveDatabaseDeps } = await import(
      "../services/resolve-database-deps"
    );
    const { resolveMessagingDeps } = await import(
      "../services/resolve-messaging-deps"
    );
    const { prisma } = await import("@/lib/prisma");
    const { revalidatePath } = await import("next/cache");

    vi.mocked(resolveHttpDependencies).mockResolvedValue({
      resolved: [],
      unresolved: [],
    });
    vi.mocked(resolveDatabaseDeps).mockResolvedValue([]);
    vi.mocked(resolveMessagingDeps).mockResolvedValue([]);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      if (typeof fn === "function") {
        return fn(prisma as never);
      }
    });

    const { processDependenciesAction } = await import("./process");
    await processDependenciesAction();

    expect(revalidatePath).toHaveBeenCalledWith("/graph");
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });
});
