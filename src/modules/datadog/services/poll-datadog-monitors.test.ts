import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  deriveSystemStatus,
  fetchApmServiceList,
  pollWorkspace,
} from "./poll-datadog-monitors";
import type { PollDeps, WorkspacePollingData } from "../types";

// ── deriveSystemStatus ─────────────────────────────────

describe("deriveSystemStatus", () => {
  it("returns NOT_FOUND when all services are NOT_FOUND", () => {
    expect(deriveSystemStatus(["NOT_FOUND", "NOT_FOUND"])).toBe("NOT_FOUND");
  });

  it("returns NOT_FOUND for empty array", () => {
    expect(deriveSystemStatus([])).toBe("NOT_FOUND");
  });

  it("returns OK when at least one service is OK", () => {
    expect(deriveSystemStatus(["OK", "NOT_FOUND"])).toBe("OK");
  });

  it("returns OK when all services are OK", () => {
    expect(deriveSystemStatus(["OK", "OK"])).toBe("OK");
  });

  it("returns OK for a single OK service", () => {
    expect(deriveSystemStatus(["OK"])).toBe("OK");
  });
});

// ── fetchApmServiceList ────────────────────────────────

describe("fetchApmServiceList", () => {
  const credentials = {
    apiKey: "api-key",
    appKey: "app-key",
    site: "datadoghq.com",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns service list on 200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ data: { attributes: { services: ["svc-a", "svc-b"] } } }),
        { status: 200 },
      ),
    );

    const result = await fetchApmServiceList(credentials);

    expect(result).toEqual(["svc-a", "svc-b"]);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("sends correct headers and URL", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { attributes: { services: [] } } }), { status: 200 }),
    );

    await fetchApmServiceList(credentials);

    const [url, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("api.datadoghq.com/api/v2/apm/services");
    expect((opts.headers as Record<string, string>)["DD-API-KEY"]).toBe("api-key");
    expect((opts.headers as Record<string, string>)["DD-APPLICATION-KEY"]).toBe("app-key");
  });

  it("returns empty array when response has no services", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { attributes: {} } }), { status: 200 }),
    );

    const result = await fetchApmServiceList(credentials);
    expect(result).toEqual([]);
  });

  it("throws on non-OK non-429 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("error", { status: 500 }),
    );

    await expect(fetchApmServiceList(credentials)).rejects.toThrow(
      "Datadog APM API error: 500",
    );
  });

  it("retries once on 429 and returns data on success", async () => {
    const rateLimitResponse = new Response("rate limited", {
      status: 429,
      headers: { "x-ratelimit-reset": "0" },
    });
    const successResponse = new Response(
      JSON.stringify({ data: { attributes: { services: ["svc-retry"] } } }),
      { status: 200 },
    );

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValueOnce(successResponse);

    const result = await fetchApmServiceList(credentials);
    expect(result).toEqual(["svc-retry"]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("throws on 429 when retry also fails", async () => {
    const rateLimitResponse = new Response("rate limited", {
      status: 429,
      headers: { "x-ratelimit-reset": "0" },
    });
    const retryFailResponse = new Response("still failing", { status: 500 });

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValueOnce(retryFailResponse);

    await expect(fetchApmServiceList(credentials)).rejects.toThrow(
      "Datadog APM API error after retry: 500",
    );
  });
});

// ── pollWorkspace ──────────────────────────────────────

function makeWorkspace(
  overrides: Partial<WorkspacePollingData> = {},
): WorkspacePollingData {
  return {
    id: "ws-1",
    datadogIntegration: {
      apiKey: "encrypted-api",
      appKey: "encrypted-app",
      site: "DATADOGHQ_COM",
    },
    domains: [
      {
        systems: [
          {
            id: "sys-1",
            services: [
              { id: "svc-1", slug: "my-service", datadogServiceTag: null },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

function makeDeps(overrides: Partial<PollDeps> = {}): PollDeps {
  return {
    fetchWorkspace: vi.fn().mockResolvedValue(makeWorkspace()),
    decryptKey: vi.fn().mockImplementation((v: string) => `decrypted-${v}`),
    siteToUrl: vi.fn().mockReturnValue("datadoghq.com"),
    updateService: vi.fn().mockResolvedValue(undefined),
    updateSystem: vi.fn().mockResolvedValue(undefined),
    updateIntegrationStatus: vi.fn().mockResolvedValue(undefined),
    fetchApmServices: vi.fn().mockResolvedValue(["my-service"]),
    ...overrides,
  };
}

describe("pollWorkspace", () => {
  it("returns error when fetchWorkspace fails", async () => {
    const deps = makeDeps({
      fetchWorkspace: vi.fn().mockRejectedValue(new Error("DB error")),
    });

    const result = await pollWorkspace("ws-1", deps);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/Failed to fetch workspace/);
  });

  it("returns error when workspace not found", async () => {
    const deps = makeDeps({
      fetchWorkspace: vi.fn().mockResolvedValue(null),
    });

    const result = await pollWorkspace("ws-1", deps);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/not found/i);
  });

  it("returns error when decryption fails", async () => {
    const deps = makeDeps({
      decryptKey: vi.fn().mockImplementation(() => {
        throw new Error("bad key");
      }),
    });

    const result = await pollWorkspace("ws-1", deps);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/Decryption failed/);
  });

  it("marks integration INVALID on 401/403 from APM fetch", async () => {
    const deps = makeDeps({
      fetchApmServices: vi.fn().mockRejectedValue(new Error("401 Unauthorized")),
    });

    const result = await pollWorkspace("ws-1", deps);

    expect(deps.updateIntegrationStatus).toHaveBeenCalledWith("ws-1", "INVALID");
    expect(result.errors[0]).toMatch(/Bad credentials/);
  });

  it("returns error on generic APM fetch failure", async () => {
    const deps = makeDeps({
      fetchApmServices: vi.fn().mockRejectedValue(new Error("timeout")),
    });

    const result = await pollWorkspace("ws-1", deps);

    expect(result.errors[0]).toMatch(/Failed to fetch APM services/);
    expect(deps.updateIntegrationStatus).not.toHaveBeenCalled();
  });

  it("matches services by slug (case-insensitive) and updates statuses", async () => {
    const workspace = makeWorkspace({
      domains: [
        {
          systems: [
            {
              id: "sys-1",
              services: [
                { id: "svc-1", slug: "My-Service", datadogServiceTag: null },
                { id: "svc-2", slug: "missing-svc", datadogServiceTag: null },
              ],
            },
          ],
        },
      ],
    });
    const deps = makeDeps({
      fetchWorkspace: vi.fn().mockResolvedValue(workspace),
      fetchApmServices: vi.fn().mockResolvedValue(["my-service"]),
    });

    const result = await pollWorkspace("ws-1", deps);

    expect(deps.updateService).toHaveBeenCalledWith("svc-1", "OK");
    expect(deps.updateService).toHaveBeenCalledWith("svc-2", "NOT_FOUND");
    expect(result.servicesPolled).toBe(2);
  });

  it("uses datadogServiceTag when available instead of slug", async () => {
    const workspace = makeWorkspace({
      domains: [
        {
          systems: [
            {
              id: "sys-1",
              services: [
                { id: "svc-1", slug: "app-slug", datadogServiceTag: "custom-tag" },
              ],
            },
          ],
        },
      ],
    });
    const deps = makeDeps({
      fetchWorkspace: vi.fn().mockResolvedValue(workspace),
      fetchApmServices: vi.fn().mockResolvedValue(["custom-tag"]),
    });

    const result = await pollWorkspace("ws-1", deps);

    expect(deps.updateService).toHaveBeenCalledWith("svc-1", "OK");
    expect(result.servicesPolled).toBe(1);
  });

  it("derives and updates system status based on service statuses", async () => {
    const workspace = makeWorkspace({
      domains: [
        {
          systems: [
            {
              id: "sys-1",
              services: [
                { id: "svc-1", slug: "found-svc", datadogServiceTag: null },
                { id: "svc-2", slug: "missing-svc", datadogServiceTag: null },
              ],
            },
          ],
        },
      ],
    });
    const deps = makeDeps({
      fetchWorkspace: vi.fn().mockResolvedValue(workspace),
      fetchApmServices: vi.fn().mockResolvedValue(["found-svc"]),
    });

    await pollWorkspace("ws-1", deps);

    // System has at least one OK service, so system should be OK
    expect(deps.updateSystem).toHaveBeenCalledWith("sys-1", "OK");
  });

  it("does not update system status when system has no services", async () => {
    const workspace = makeWorkspace({
      domains: [
        {
          systems: [{ id: "sys-1", services: [] }],
        },
      ],
    });
    const deps = makeDeps({
      fetchWorkspace: vi.fn().mockResolvedValue(workspace),
    });

    await pollWorkspace("ws-1", deps);

    expect(deps.updateSystem).not.toHaveBeenCalled();
  });

  it("reports apmServicesFound count", async () => {
    const deps = makeDeps({
      fetchApmServices: vi.fn().mockResolvedValue(["a", "b", "c"]),
    });

    const result = await pollWorkspace("ws-1", deps);

    expect(result.apmServicesFound).toBe(3);
  });

  it("records error but continues when updateService fails", async () => {
    const workspace = makeWorkspace({
      domains: [
        {
          systems: [
            {
              id: "sys-1",
              services: [
                { id: "svc-1", slug: "svc-a", datadogServiceTag: null },
                { id: "svc-2", slug: "svc-b", datadogServiceTag: null },
              ],
            },
          ],
        },
      ],
    });
    const deps = makeDeps({
      fetchWorkspace: vi.fn().mockResolvedValue(workspace),
      fetchApmServices: vi.fn().mockResolvedValue(["svc-a", "svc-b"]),
      updateService: vi
        .fn()
        .mockRejectedValueOnce(new Error("DB fail"))
        .mockResolvedValueOnce(undefined),
    });

    const result = await pollWorkspace("ws-1", deps);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/svc-1/);
    expect(result.servicesPolled).toBe(1);
  });

  it("records error when updateSystem fails", async () => {
    const deps = makeDeps({
      updateSystem: vi.fn().mockRejectedValue(new Error("DB fail")),
    });

    const result = await pollWorkspace("ws-1", deps);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/System sys-1/);
  });

  it("handles multiple domains and systems", async () => {
    const workspace = makeWorkspace({
      domains: [
        {
          systems: [
            {
              id: "sys-1",
              services: [{ id: "svc-1", slug: "svc-a", datadogServiceTag: null }],
            },
          ],
        },
        {
          systems: [
            {
              id: "sys-2",
              services: [{ id: "svc-2", slug: "svc-b", datadogServiceTag: null }],
            },
          ],
        },
      ],
    });
    const deps = makeDeps({
      fetchWorkspace: vi.fn().mockResolvedValue(workspace),
      fetchApmServices: vi.fn().mockResolvedValue(["svc-a", "svc-b"]),
    });

    const result = await pollWorkspace("ws-1", deps);

    expect(result.servicesPolled).toBe(2);
    expect(deps.updateSystem).toHaveBeenCalledWith("sys-1", "OK");
    expect(deps.updateSystem).toHaveBeenCalledWith("sys-2", "OK");
  });

  it("deduplicates APM service names (case-insensitive)", async () => {
    const deps = makeDeps({
      fetchApmServices: vi.fn().mockResolvedValue(["SVC-A", "svc-a"]),
    });

    const result = await pollWorkspace("ws-1", deps);

    expect(result.apmServicesFound).toBe(1);
  });
});
