import type {
  Integration,
  System,
  Dependency,
  UnresolvedIntegration,
  ResolveHttpDepsResult,
} from "../types";

const HTTP_API = "HTTP_API";

/**
 * Resolves HTTP_API integrations into dependency edges.
 *
 * Resolution order for `targetSystem` slug:
 *   1. Direct `System.slug` match
 *   2. Fallback: `Service.slug` → owning `System` (handles monolith sub-services)
 *   3. If neither matches → unresolved
 */
export async function resolveHttpDependencies(
  getAllIntegrations: () => Promise<Integration[]>,
  getSystemBySlug: (slug: string) => Promise<System | null>,
  getSystemByServiceSlug?: (slug: string) => Promise<System | null>,
): Promise<ResolveHttpDepsResult> {
  const integrations = await getAllIntegrations();
  const httpIntegrations = integrations.filter((i) => i.type === HTTP_API);

  const resolved: Dependency[] = [];
  const unresolved: UnresolvedIntegration[] = [];

  for (const integration of httpIntegrations) {
    if (!integration.targetSystem) {
      unresolved.push({
        integrationId: integration.id,
        integrationName: integration.name,
        sourceSystemId: integration.systemId,
        targetSystemSlug: null,
        reason: "Missing targetSystem slug",
      });
      continue;
    }

    // 1. Try direct system slug match
    let target = await getSystemBySlug(integration.targetSystem);
    let matchedViaServiceSlug = false;

    // 2. Fallback: try matching a service slug → owning system
    if (!target && getSystemByServiceSlug) {
      target = await getSystemByServiceSlug(integration.targetSystem);
      if (target) matchedViaServiceSlug = true;
    }

    if (!target) {
      unresolved.push({
        integrationId: integration.id,
        integrationName: integration.name,
        sourceSystemId: integration.systemId,
        targetSystemSlug: integration.targetSystem,
        reason: `Target system "${integration.targetSystem}" not found`,
      });
      continue;
    }

    const metadata: Record<string, unknown> = {};
    if (integration.url) metadata.url = integration.url;
    if (matchedViaServiceSlug) metadata.targetServiceSlug = integration.targetSystem;

    resolved.push({
      sourceId: integration.systemId,
      targetId: target.id,
      type: HTTP_API,
      label: integration.name,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    });
  }

  return { resolved, unresolved };
}
