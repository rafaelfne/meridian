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
const HORIZONTAL_SEP = 80;
const VERTICAL_SEP = 50;

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

  // Build nodes
  const nodes: GraphNode[] = systems.map((system) => ({
    id: system.id,
    type: "system",
    position: { x: 0, y: 0 },
    data: {
      label: system.name,
      domain: system.domain.name,
      language: system.language,
      framework: system.framework,
      servicesCount: system._count.services,
      risksCount: system._count.risks,
      domainColor: getDomainColor(system.domain.name),
      layer: system.layer ?? undefined,
    },
  }));

  // Build edges (only include edges where both source and target exist in the filtered systems)
  const edges: GraphEdge[] = dependencies
    .filter((dep) => systemIds.has(dep.sourceId) && systemIds.has(dep.targetId))
    .map((dep) => {
      const style = getEdgeStyle(dep.type);
      return {
        id: dep.id,
        source: dep.sourceId,
        target: dep.targetId,
        type: "smoothstep",
        animated: style.animated,
        style: { stroke: style.stroke, strokeWidth: 2 },
        data: {
          type: dep.type,
          label: resolveEdgeLabel(dep.type, dep.label),
          showParticles: style.animated,
        },
      };
    });

  // Calculate layout with dagre
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "LR",
    nodesep: VERTICAL_SEP,
    ranksep: HORIZONTAL_SEP,
  });

  for (const node of nodes) {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  // Apply calculated positions to nodes
  const layoutNodes: GraphNode[] = nodes.map((node) => {
    const nodeWithPosition = graph.node(node.id) as
      | dagre.Node
      | undefined;
    const x = nodeWithPosition?.x ?? 0;
    const y = nodeWithPosition?.y ?? 0;

    return {
      ...node,
      position: {
        x: x - NODE_WIDTH / 2,
        y: y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutNodes, edges };
}
