export type HealthStatus = "operational" | "partial_outage" | "major_outage";

const SEVERITY: Record<HealthStatus, number> = {
  operational: 0,
  partial_outage: 1,
  major_outage: 2,
};

export function worstStatus(statuses: HealthStatus[]): HealthStatus {
  let worst: HealthStatus = "operational";
  for (const s of statuses) {
    if (SEVERITY[s] > SEVERITY[worst]) {
      worst = s;
    }
  }
  return worst;
}

/**
 * Derive a HealthStatus from a Datadog monitor status string.
 * Excludes NOT_FOUND; treats null/NO_DATA as operational.
 */
export function fromDatadogStatus(
  status: string | null | undefined,
): HealthStatus | null {
  if (!status || status === "NOT_FOUND") return null;
  switch (status) {
    case "OK":
    case "NO_DATA":
      return "operational";
    case "WARN":
      return "partial_outage";
    case "ALERT":
      return "major_outage";
    default:
      return null;
  }
}

export function overallBanner(status: HealthStatus): string {
  switch (status) {
    case "operational":
      return "All systems operational";
    case "partial_outage":
      return "Partial degradation";
    case "major_outage":
      return "Major outage";
  }
}

export function statusLabel(status: HealthStatus): string {
  switch (status) {
    case "operational":
      return "Operational";
    case "partial_outage":
      return "Partial outage";
    case "major_outage":
      return "Major outage";
  }
}
