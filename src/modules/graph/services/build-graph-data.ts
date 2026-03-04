import dagre from "dagre";
import type {
  SystemWithCounts,
  DependencyRecord,
  GraphNode,
  GraphEdge,
  GraphData,
} from "../types";
import {
  DEPENDENCY_TYPE_CONFIG,
  DEFAULT_EDGE_STYLE,
  type DependencyTypeName,
} from "../constants";

const NODE_WIDTH = 250;
const NODE_HEIGHT = 100;
const SERVICE_PORT_HEIGHT = 24;
const HORIZONTAL_SEP = 256;
const VERTICAL_SEP = 144;

/** Calculate node height based on the number of targeted services. */
function getNodeHeight(targetedServicesCount: number): number {
  if (targetedServicesCount === 0) return NODE_HEIGHT;
  return NODE_HEIGHT + targetedServicesCount * SERVICE_PORT_HEIGHT;
}

/**
 * Deterministic color palette for domain names.
 * Uses a simple string hash to pick from a fixed set of colors.
 */
const DOMAIN_COLORS = [
  "#4f46e5", // indigo
  "#0891b2", // cyan
  "#059669", // emerald
  "#d97706", // amber
  "#dc2626", // red
  "#7c3aed", // violet
  "#db2777", // pink
  "#2563eb", // blue
  "#ca8a04", // yellow
  "#16a34a", // green
] as const;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function getDomainColor(domainName: string): string {
  const index = hashString(domainName) % DOMAIN_COLORS.length;
  return DOMAIN_COLORS[index] ?? DOMAIN_COLORS[0];
}

function getEdgeStyle(type: string): { stroke: string; animated: boolean } {
  const config = DEPENDENCY_TYPE_CONFIG[type as DependencyTypeName];
  if (config) {
    return { stroke: config.color, animated: config.animated };
  }
  return { stroke: DEFAULT_EDGE_STYLE.color, animated: DEFAULT_EDGE_STYLE.animated };
}

function resolveEdgeLabel(type: string, label: string | null): string {
  if (label) return label;
  return type.replace(/_/g, " ").toLowerCase();
}

/**
 * Builds React Flow graph data from raw system and dependency records.
 *
 * This is a pure function with no framework or database dependencies.
 * Layout is computed server-side using dagre (left-to-right direction).
 */
export function buildGraphData(
  systems: SystemWithCounts[],
  dependencies: DependencyRecord[],
): GraphData {
  if (systems.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Build a set of valid system IDs for filtering edges
  const systemIds = new Set(systems.map((s) => s.id));

  // Collect which services are targeted by edges (per target system)
  const targetedServiceSlugs = new Map<string, Set<string>>();
  for (const dep of dependencies) {
    const slug = (dep.metadata as Record<string, unknown> | null)?.targetServiceSlug as string | undefined;
    if (slug && systemIds.has(dep.targetId)) {
      let slugs = targetedServiceSlugs.get(dep.targetId);
      if (!slugs) {
        slugs = new Set();
        targetedServiceSlugs.set(dep.targetId, slugs);
      }
      slugs.add(slug);
    }
  }

  // Build nodes — only include services that are targeted by edges
  const nodes: GraphNode[] = systems.map((system) => {
    const targeted = targetedServiceSlugs.get(system.id);
    const filteredServices = targeted && system.services
      ? system.services.filter((s) => targeted.has(s.slug))
      : undefined;

    return {
      id: system.id,
      type: "system",
      position: { x: 0, y: 0 },
      data: {
        label: system.name,
        slug: system.slug,
        domain: system.domain.name,
        language: system.language,
        framework: system.framework,
        servicesCount: system._count.services,
        risksCount: system._count.risks,
        domainColor: getDomainColor(system.domain.name),
        layer: system.layer ?? undefined,
        services: filteredServices?.length ? filteredServices : undefined,
      },
    };
  });

  // Build edges (only include edges where both source and target exist in the filtered systems)
  const rawEdges: GraphEdge[] = dependencies
    .filter((dep) => systemIds.has(dep.sourceId) && systemIds.has(dep.targetId))
    .map((dep) => {
      const style = getEdgeStyle(dep.type);
      const targetServiceSlug =
        (dep.metadata as Record<string, unknown> | null)?.targetServiceSlug as string | undefined;
      return {
        id: dep.id,
        source: dep.sourceId,
        target: dep.targetId,
        ...(targetServiceSlug ? { targetHandle: `svc-${targetServiceSlug}` } : {}),
        type: "smoothstep",
        animated: style.animated,
        style: { stroke: style.stroke, strokeWidth: 2 },
        markerEnd: {
          type: "arrow",
          color: style.stroke,
          width: 8,
          height: 8,
        },
        data: {
          type: dep.type,
          label: resolveEdgeLabel(dep.type, dep.label),
          showParticles: style.animated,
          ...(targetServiceSlug ? { targetServiceSlug } : {}),
        },
      };
    });

  // Compute parallel offsets for edges sharing the same node pair
  const edges = assignParallelOffsets(rawEdges);

  // Calculate layout with dagre
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "LR",
    nodesep: VERTICAL_SEP,
    ranksep: HORIZONTAL_SEP,
  });

  for (const node of nodes) {
    const height = getNodeHeight(node.data.services?.length ?? 0);
    graph.setNode(node.id, { width: NODE_WIDTH, height });
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  // Apply calculated positions to nodes
  const layoutNodes: GraphNode[] = nodes.map((node) => {
    const height = getNodeHeight(node.data.services?.length ?? 0);
    const nodeWithPosition = graph.node(node.id) as
      | dagre.Node
      | undefined;
    const x = nodeWithPosition?.x ?? 0;
    const y = nodeWithPosition?.y ?? 0;

    return {
      ...node,
      position: {
        x: x - NODE_WIDTH / 2,
        y: y - height / 2,
      },
    };
  });

  return { nodes: layoutNodes, edges };
}

/**
 * For edges sharing the same source–target pair, assign a vertical offset
 * so they fan out instead of stacking on top of each other.
 */
const PARALLEL_EDGE_GAP = 25;

function assignParallelOffsets(edges: GraphEdge[]): GraphEdge[] {
  const groups = new Map<string, GraphEdge[]>();

  for (const edge of edges) {
    // Normalize key so A→B and B→A are the same group
    const key = [edge.source, edge.target].sort().join("|");
    let group = groups.get(key);
    if (!group) {
      group = [];
      groups.set(key, group);
    }
    group.push(edge);
  }

  const result: GraphEdge[] = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      result.push(group[0]!);
      continue;
    }

    group.forEach((edge, i) => {
      const offset = (i - (group.length - 1) / 2) * PARALLEL_EDGE_GAP;
      result.push({
        ...edge,
        data: { ...edge.data, parallelOffset: offset },
      });
    });
  }

  return result;
}
