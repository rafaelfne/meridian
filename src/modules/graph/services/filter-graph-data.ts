import type { GraphData, GraphNode, GraphEdge } from "../types";

/** Layout mode for the graph visualization. */
export type LayoutMode = "default" | "layered";

/** Filter criteria for client-side graph filtering. */
export interface GraphFilters {
  domains: string[];
  dependencyTypes: string[];
  languages: string[];
  search: string;
  showIsolated: boolean;
  showParticles: boolean;
  layoutMode: LayoutMode;
  clustering: boolean;
}

export const DEFAULT_GRAPH_FILTERS: GraphFilters = {
  domains: [],
  dependencyTypes: [],
  languages: [],
  search: "",
  showIsolated: true,
  showParticles: true,
  layoutMode: "default",
  clustering: false,
};

/**
 * Applies client-side filters to graph data.
 * Pure function — no framework or database dependencies.
 */
export function filterGraphData(
  data: GraphData,
  filters: GraphFilters,
): GraphData {
  let nodes = data.nodes;
  let edges = data.edges;

  // Filter nodes by domain
  if (filters.domains.length > 0) {
    nodes = nodes.filter((n) => filters.domains.includes(n.data.domain));
  }

  // Filter nodes by language
  if (filters.languages.length > 0) {
    nodes = nodes.filter(
      (n) => n.data.language !== null && filters.languages.includes(n.data.language),
    );
  }

  // Filter nodes by search text (case-insensitive match on label)
  if (filters.search.trim() !== "") {
    const term = filters.search.trim().toLowerCase();
    nodes = nodes.filter((n) => n.data.label.toLowerCase().includes(term));
  }

  // Build set of visible node IDs after node-level filtering
  const visibleNodeIds = new Set(nodes.map((n) => n.id));

  // Filter edges: both endpoints must be visible
  edges = edges.filter(
    (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target),
  );

  // Filter edges by dependency type
  if (filters.dependencyTypes.length > 0) {
    edges = edges.filter((e) =>
      filters.dependencyTypes.includes(e.data.type),
    );
  }

  // Hide isolated nodes (nodes with no remaining edges)
  if (!filters.showIsolated) {
    const connectedNodeIds = new Set<string>();
    for (const edge of edges) {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    }
    nodes = nodes.filter((n) => connectedNodeIds.has(n.id));
  }

  // Strip particle animation when disabled
  if (!filters.showParticles) {
    edges = edges.map((e) =>
      e.data.showParticles
        ? { ...e, data: { ...e.data, showParticles: false } }
        : e,
    );
  }

  return { nodes, edges };
}

/** Extracts unique domain names from graph nodes, sorted alphabetically. */
export function extractDomains(nodes: GraphNode[]): string[] {
  return [...new Set(nodes.map((n) => n.data.domain))].sort();
}

/** Extracts unique non-null languages from graph nodes, sorted alphabetically. */
export function extractLanguages(nodes: GraphNode[]): string[] {
  return [
    ...new Set(
      nodes
        .map((n) => n.data.language)
        .filter((lang): lang is string => lang !== null),
    ),
  ].sort();
}

/** Extracts unique dependency types from graph edges, sorted alphabetically. */
export function extractDependencyTypes(edges: GraphEdge[]): string[] {
  return [...new Set(edges.map((e) => e.data.type))].sort();
}
