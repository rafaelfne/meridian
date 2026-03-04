import { describe, it, expect } from "vitest";
import {
  filterGraphData,
  extractDomains,
  extractLanguages,
  extractDependencyTypes,
  DEFAULT_GRAPH_FILTERS,
  type GraphFilters,
} from "./filter-graph-data";
import type { GraphData, GraphNode, GraphEdge } from "../types";

/* ── Helpers ──────────────────────────────────────────────────── */

function makeNode(
  id: string,
  overrides: Partial<GraphNode["data"]> = {},
): GraphNode {
  return {
    id,
    type: "system",
    position: { x: 0, y: 0 },
    data: {
      label: overrides.label ?? id,
      slug: overrides.slug ?? id,
      domain: overrides.domain ?? "default",
      language: overrides.language ?? "TypeScript",
      framework: overrides.framework ?? null,
      servicesCount: overrides.servicesCount ?? 1,
      risksCount: overrides.risksCount ?? 0,
      domainColor: overrides.domainColor ?? "#4f46e5",
    },
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  type = "HTTP_API",
): GraphEdge {
  return {
    id,
    source,
    target,
    type: "smoothstep",
    animated: false,
    style: { stroke: "#4f46e5", strokeWidth: 2 },
    data: { type, label: type.toLowerCase() },
  };
}

function buildTestGraph(): GraphData {
  return {
    nodes: [
      makeNode("a", { label: "Auth Service", domain: "Auth", language: "TypeScript" }),
      makeNode("b", { label: "Billing API", domain: "Payments", language: "Java" }),
      makeNode("c", { label: "Config Store", domain: "Auth", language: "Go" }),
      makeNode("d", { label: "Data Lake", domain: "Analytics", language: null }),
    ],
    edges: [
      makeEdge("e1", "a", "b", "HTTP_API"),
      makeEdge("e2", "b", "c", "KAFKA_TOPIC"),
      makeEdge("e3", "a", "c", "SHARED_DATABASE"),
    ],
  };
}

/* ── filterGraphData ──────────────────────────────────────────── */

describe("filterGraphData", () => {
  it("returns all data when using default filters", () => {
    const graph = buildTestGraph();
    const result = filterGraphData(graph, DEFAULT_GRAPH_FILTERS);

    expect(result.nodes).toHaveLength(4);
    expect(result.edges).toHaveLength(3);
  });

  it("filters nodes by single domain", () => {
    const graph = buildTestGraph();
    const filters: GraphFilters = { ...DEFAULT_GRAPH_FILTERS, domains: ["Auth"] };
    const result = filterGraphData(graph, filters);

    expect(result.nodes).toHaveLength(2);
    expect(result.nodes.map((n) => n.id)).toEqual(["a", "c"]);
  });

  it("filters nodes by multiple domains", () => {
    const graph = buildTestGraph();
    const filters: GraphFilters = {
      ...DEFAULT_GRAPH_FILTERS,
      domains: ["Auth", "Payments"],
    };
    const result = filterGraphData(graph, filters);

    expect(result.nodes).toHaveLength(3);
    expect(result.nodes.map((n) => n.id)).toEqual(["a", "b", "c"]);
  });

  it("filters nodes by language", () => {
    const graph = buildTestGraph();
    const filters: GraphFilters = {
      ...DEFAULT_GRAPH_FILTERS,
      languages: ["Java"],
    };
    const result = filterGraphData(graph, filters);

    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]?.id).toBe("b");
  });

  it("excludes nodes with null language when language filter is active", () => {
    const graph = buildTestGraph();
    const filters: GraphFilters = {
      ...DEFAULT_GRAPH_FILTERS,
      languages: ["Go"],
    };
    const result = filterGraphData(graph, filters);

    expect(result.nodes.map((n) => n.id)).toEqual(["c"]);
  });

  it("filters nodes by search text (case-insensitive)", () => {
    const graph = buildTestGraph();
    const filters: GraphFilters = { ...DEFAULT_GRAPH_FILTERS, search: "auth" };
    const result = filterGraphData(graph, filters);

    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]?.id).toBe("a");
  });

  it("removes edges when their endpoints are filtered out", () => {
    const graph = buildTestGraph();
    const filters: GraphFilters = { ...DEFAULT_GRAPH_FILTERS, domains: ["Auth"] };
    const result = filterGraphData(graph, filters);

    // Only edge e3 (a→c) should remain since both a and c are in Auth
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]?.id).toBe("e3");
  });

  it("filters edges by dependency type", () => {
    const graph = buildTestGraph();
    const filters: GraphFilters = {
      ...DEFAULT_GRAPH_FILTERS,
      dependencyTypes: ["HTTP_API"],
    };
    const result = filterGraphData(graph, filters);

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]?.data.type).toBe("HTTP_API");
  });

  it("hides isolated nodes when showIsolated is false", () => {
    const graph = buildTestGraph();
    const filters: GraphFilters = {
      ...DEFAULT_GRAPH_FILTERS,
      showIsolated: false,
    };
    const result = filterGraphData(graph, filters);

    // Node "d" (Data Lake) has no edges → should be hidden
    expect(result.nodes).toHaveLength(3);
    expect(result.nodes.map((n) => n.id)).toEqual(["a", "b", "c"]);
  });

  it("combines domain + showIsolated filters", () => {
    const graph = buildTestGraph();
    const filters: GraphFilters = {
      ...DEFAULT_GRAPH_FILTERS,
      domains: ["Auth"],
      showIsolated: false,
    };
    const result = filterGraphData(graph, filters);

    // Nodes a and c are in Auth; edge e3 connects them
    // Both have edges → both kept
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
  });

  it("returns empty graph when no nodes match", () => {
    const graph = buildTestGraph();
    const filters: GraphFilters = {
      ...DEFAULT_GRAPH_FILTERS,
      search: "nonexistent",
    };
    const result = filterGraphData(graph, filters);

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it("handles empty graph data", () => {
    const graph: GraphData = { nodes: [], edges: [] };
    const result = filterGraphData(graph, DEFAULT_GRAPH_FILTERS);

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it("trims search text whitespace", () => {
    const graph = buildTestGraph();
    const filters: GraphFilters = {
      ...DEFAULT_GRAPH_FILTERS,
      search: "  billing  ",
    };
    const result = filterGraphData(graph, filters);

    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]?.id).toBe("b");
  });
});

/* ── Extract helpers ──────────────────────────────────────────── */

describe("extractDomains", () => {
  it("returns sorted unique domains", () => {
    const nodes = [
      makeNode("a", { domain: "Payments" }),
      makeNode("b", { domain: "Auth" }),
      makeNode("c", { domain: "Auth" }),
    ];
    expect(extractDomains(nodes)).toEqual(["Auth", "Payments"]);
  });

  it("returns empty array for empty nodes", () => {
    expect(extractDomains([])).toEqual([]);
  });
});

describe("extractLanguages", () => {
  it("returns sorted unique non-null languages", () => {
    const nodes = [
      makeNode("a", { language: "Java" }),
      makeNode("b", { language: "TypeScript" }),
      makeNode("c", { language: null }),
      makeNode("d", { language: "Java" }),
    ];
    expect(extractLanguages(nodes)).toEqual(["Java", "TypeScript"]);
  });
});

describe("extractDependencyTypes", () => {
  it("returns sorted unique dependency types", () => {
    const edges = [
      makeEdge("e1", "a", "b", "KAFKA_TOPIC"),
      makeEdge("e2", "b", "c", "HTTP_API"),
      makeEdge("e3", "c", "d", "KAFKA_TOPIC"),
    ];
    expect(extractDependencyTypes(edges)).toEqual(["HTTP_API", "KAFKA_TOPIC"]);
  });
});
