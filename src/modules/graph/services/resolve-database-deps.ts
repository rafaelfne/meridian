import type {
  DatabaseRecord,
  DependencyResult,
  IntegrationRecord,
} from "../types";

export interface ResolveDatabaseDepsDeps {
  getAllDatabases: () => Promise<DatabaseRecord[]>;
  getAllIntegrations: () => Promise<IntegrationRecord[]>;
  getSystemBySlug: (slug: string) => Promise<{ id: string } | null>;
}

/**
 * Resolves database-related dependencies across systems.
 *
 * 1. SHARED_DATABASE – when the same database name + provider combination
 *    appears across different systems, creates pair-wise dependencies.
 * 2. CROSS_DATABASE_QUERY – when a DATABASE_DIRECT integration exists,
 *    creates a dependency from the integration's source system to the
 *    resolved target system.
 */
export async function resolveDatabaseDeps(
  deps: ResolveDatabaseDepsDeps,
): Promise<DependencyResult[]> {
  const results: DependencyResult[] = [];

  // --- Shared databases ---
  const databases = await deps.getAllDatabases();
  const dbGroups = new Map<string, Set<string>>();

  for (const db of databases) {
    const key = `${db.name}::${db.provider}`;
    let systems = dbGroups.get(key);
    if (!systems) {
      systems = new Set<string>();
      dbGroups.set(key, systems);
    }
    systems.add(db.systemId);
  }

  for (const [key, systemIds] of dbGroups) {
    if (systemIds.size < 2) continue;

    const dbName = key.split("::")[0]!;
    const sorted = [...systemIds].sort();

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        results.push({
          sourceId: sorted[i]!,
          targetId: sorted[j]!,
          type: "SHARED_DATABASE",
          label: dbName,
        });
      }
    }
  }

  // --- Cross-database queries ---
  const integrations = await deps.getAllIntegrations();

  for (const integration of integrations) {
    if (integration.type !== "DATABASE_DIRECT") continue;
    if (!integration.targetSystem) continue;

    const target = await deps.getSystemBySlug(integration.targetSystem);
    if (!target) continue;

    results.push({
      sourceId: integration.systemId,
      targetId: target.id,
      type: "CROSS_DATABASE_QUERY",
      label: integration.name,
    });
  }

  return results;
}
