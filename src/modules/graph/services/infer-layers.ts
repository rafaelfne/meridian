import type {
  SystemWithCounts,
  DependencyRecord,
  LayerName,
} from "../types";

/**
 * Infers topological layers for systems based on dependency graph structure.
 *
 * - Systems with no incoming dependencies are classified as EDGE (entry points).
 * - Systems with no outgoing dependencies are classified as DATA_INFRA (leaf nodes).
 * - All other systems are classified as BUSINESS_LOGIC.
 * - If a system has an explicit `layer` field set, that value takes precedence.
 */
export function inferLayers(
  systems: SystemWithCounts[],
  dependencies: DependencyRecord[],
): Map<string, LayerName> {
  const incoming = new Set<string>();
  const outgoing = new Set<string>();

  for (const dep of dependencies) {
    outgoing.add(dep.sourceId);
    incoming.add(dep.targetId);
  }

  const layers = new Map<string, LayerName>();

  for (const system of systems) {
    if (system.layer) {
      layers.set(system.id, system.layer);
      continue;
    }

    const hasIncoming = incoming.has(system.id);
    const hasOutgoing = outgoing.has(system.id);

    if (!hasIncoming && hasOutgoing) {
      layers.set(system.id, "EDGE");
    } else if (hasIncoming && !hasOutgoing) {
      layers.set(system.id, "DATA_INFRA");
    } else {
      layers.set(system.id, "BUSINESS_LOGIC");
    }
  }

  return layers;
}
