import type { DatadogMonitorStatus } from "@/generated/prisma/enums";

/** Credentials needed for Datadog API calls, already decrypted. */
export interface DatadogCredentials {
  apiKey: string;
  appKey: string;
  site: string; // e.g. "datadoghq.com"
}

/** Shape of workspace data fetched for the cron job. */
export interface WorkspacePollingData {
  id: string;
  datadogIntegration: {
    apiKey: string; // encrypted
    appKey: string; // encrypted
    site: string; // DatadogSite enum value e.g. "DATADOGHQ_COM"
  };
  domains: {
    systems: {
      id: string;
      services: { id: string; slug: string; datadogServiceTag: string | null }[];
    }[];
  }[];
}

/** Summary returned by the poll orchestrator. */
export interface PollRunSummary {
  workspaceId: string;
  servicesPolled: number;
  apmServicesFound: number;
  errors: string[];
}

/** Dependencies injected into the poll orchestrator for testability. */
export interface PollDeps {
  fetchWorkspace: (workspaceId: string) => Promise<WorkspacePollingData | null>;
  decryptKey: (ciphertext: string) => string;
  siteToUrl: (enumValue: string) => string;
  updateService: (
    serviceId: string,
    status: DatadogMonitorStatus,
  ) => Promise<void>;
  updateSystem: (
    systemId: string,
    status: DatadogMonitorStatus,
  ) => Promise<void>;
  updateIntegrationStatus: (
    workspaceId: string,
    status: "INVALID",
  ) => Promise<void>;
  fetchApmServices: (
    credentials: DatadogCredentials,
  ) => Promise<string[]>;
}
