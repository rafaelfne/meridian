import dagre from "dagre";
import type {
  SystemWithCounts,
  DependencyRecord,
  GraphNode,
  GraphEdge,
  GraphData,
} from "../types";

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

/** Style mapping for dependency types */
const EDGE_STYLES: Record<string, { stroke: string; animated: boolean }> = {
  HTTP_API: { stroke: "#4f46e5", animated: false },
  KAFKA_TOPIC: { stroke: "#059669", animated: true },
  SHARED_DATABASE: { stroke: "#d97706", animated: false },
  CROSS_DATABASE_QUERY: { stroke: "#dc2626", animated: false },
  SHARED_PACKAGE: { stroke: "#7c3aed", animated: false },
  GRPC: { stroke: "#0891b2", animated: false },
  FILE_DEPENDENCY: { stroke: "#6b7280", animated: false },
};

const DEFAULT_EDGE_STYLE = { stroke: "#94a3b8", animated: false };

function getEdgeStyle(type: string): { stroke: string; animated: boolean } {
  return EDGE_STYLES[type] ?? DEFAULT_EDGE_STYLE;
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
