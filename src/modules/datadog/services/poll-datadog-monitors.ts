import type { DatadogMonitorStatus } from "@/generated/prisma/enums";
import type {
  DatadogCredentials,
  PollDeps,
  PollRunSummary,
} from "../types";

// ── Pure functions ──────────────────────────────────────

export function deriveSystemStatus(
  serviceStatuses: DatadogMonitorStatus[],
): DatadogMonitorStatus {
  const relevant = serviceStatuses.filter((s) => s !== "NOT_FOUND");

  if (relevant.length === 0) {
    return "NOT_FOUND";
  }

  // For APM-based polling, services are either OK or NOT_FOUND
  // If any relevant service exists, system is OK
  return "OK";
}

// ── Datadog APM API caller ──────────────────────────────

export async function fetchApmServiceList(
  credentials: DatadogCredentials,
): Promise<string[]> {
  const url = new URL(`https://api.${credentials.site}/api/v2/apm/services`);
  url.searchParams.set("filter[env]", "*");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "DD-API-KEY": credentials.apiKey,
      "DD-APPLICATION-KEY": credentials.appKey,
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (response.status === 429) {
    const retryAfter = parseInt(
      response.headers.get("x-ratelimit-reset") ?? "5",
      10,
    );
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));

    const retryResponse = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "DD-API-KEY": credentials.apiKey,
        "DD-APPLICATION-KEY": credentials.appKey,
      },
      signal: AbortSignal.timeout(30_000),
    });

    if (!retryResponse.ok) {
      throw new Error(
        `Datadog APM API error after retry: ${retryResponse.status}`,
      );
    }
    const body = await retryResponse.json();
    return body?.data?.attributes?.services ?? [];
  }

  if (!response.ok) {
    throw new Error(`Datadog APM API error: ${response.status}`);
  }

  const body = await response.json();
  return body?.data?.attributes?.services ?? [];
}

// ── Orchestrator ────────────────────────────────────────

export async function pollWorkspace(
  workspaceId: string,
  deps: PollDeps,
): Promise<PollRunSummary> {
  const summary: PollRunSummary = {
    workspaceId,
    servicesPolled: 0,
    apmServicesFound: 0,
    errors: [],
  };

  let workspace;
  try {
    workspace = await deps.fetchWorkspace(workspaceId);
  } catch (err) {
    summary.errors.push(
      `Failed to fetch workspace: ${err instanceof Error ? err.message : String(err)}`,
    );
    return summary;
  }

  if (!workspace) {
    summary.errors.push(
      "Workspace not found or Datadog integration is not connected",
    );
    return summary;
  }

  let apiKey: string;
  let appKey: string;
  try {
    apiKey = deps.decryptKey(workspace.datadogIntegration.apiKey);
    appKey = deps.decryptKey(workspace.datadogIntegration.appKey);
  } catch (err) {
    summary.errors.push(
      `Decryption failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    return summary;
  }

  const site = deps.siteToUrl(workspace.datadogIntegration.site);
  const credentials: DatadogCredentials = { apiKey, appKey, site };

  // Fetch all APM services in one call
  let apmServiceNames: string[];
  try {
    apmServiceNames = await deps.fetchApmServices(credentials);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes("401") || message.includes("403")) {
      try {
        await deps.updateIntegrationStatus(workspace.id, "INVALID");
      } catch {
        // best-effort
      }
      summary.errors.push("Bad credentials, integration marked INVALID");
      return summary;
    }

    summary.errors.push(`Failed to fetch APM services: ${message}`);
    return summary;
  }

  // Build a Set for O(1) lookups
  const apmServiceSet = new Set(apmServiceNames.map((s) => s.toLowerCase()));
  summary.apmServicesFound = apmServiceSet.size;

  const systems = workspace.domains.flatMap((d) => d.systems);
  const serviceResults = new Map<
    string,
    { status: DatadogMonitorStatus; systemId: string }
  >();

  // Match our services against APM catalog
  for (const system of systems) {
    for (const service of system.services) {
      const tag = (service.datadogServiceTag ?? service.slug).toLowerCase();
      const status: DatadogMonitorStatus = apmServiceSet.has(tag)
        ? "OK"
        : "NOT_FOUND";

      serviceResults.set(service.id, { status, systemId: system.id });

      try {
        await deps.updateService(service.id, status);
        summary.servicesPolled++;
      } catch (err) {
        summary.errors.push(
          `Service ${service.id} (${service.slug}): update failed - ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  // Derive system statuses
  for (const system of systems) {
    const systemServiceStatuses = system.services
      .map((svc) => serviceResults.get(svc.id)?.status)
      .filter((s): s is DatadogMonitorStatus => s !== undefined);

    if (systemServiceStatuses.length > 0) {
      const systemStatus = deriveSystemStatus(systemServiceStatuses);
      try {
        await deps.updateSystem(system.id, systemStatus);
      } catch (err) {
        summary.errors.push(
          `System ${system.id}: update failed - ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  return summary;
}
