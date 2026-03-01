import dagre from "dagre";
import type {
  SystemWithCounts,
  DependencyRecord,
  GraphNode,
  GraphEdge,
  GraphData,
  LayerName,
} from "../types";
import {
  DEPENDENCY_TYPE_CONFIG,
  DEFAULT_EDGE_STYLE,
  LAYER_CONFIG,
  type DependencyTypeName,
} from "../constants";
import { inferLayers } from "./infer-layers";

const NODE_WIDTH = 250;
const NODE_HEIGHT = 100;
const HORIZONTAL_SEP = 320;
const VERTICAL_SEP = 180;
const LAYER_GAP = 200;
const LAYER_LABEL_HEIGHT = 40;

/**
 * Deterministic color palette for domain names.
 */
const DOMAIN_COLORS = [
  "#4f46e5", "#0891b2", "#059669", "#d97706", "#dc2626",
  "#7c3aed", "#db2777", "#2563eb", "#ca8a04", "#16a34a",
] as const;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getDomainColor(domainName: string): string {
  const index = hashString(domainName) % DOMAIN_COLORS.length;
  return DOMAIN_COLORS[index] ?? DOMAIN_COLORS[0];
}

function getEdgeStyle(type: string): { stroke: string; animated: boolean } {
  const config = DEPENDENCY_TYPE_CONFIG[type as DependencyTypeName];
  if (config) return { stroke: config.color, animated: config.animated };
  return { stroke: DEFAULT_EDGE_STYLE.color, animated: DEFAULT_EDGE_STYLE.animated };
}

function resolveEdgeLabel(type: string, label: string | null): string {
  if (label) return label;
  return type.replace(/_/g, " ").toLowerCase();
}

const LAYER_ORDER: LayerName[] = ["EDGE", "BUSINESS_LOGIC", "DATA_INFRA"];

/**
 * Builds graph data with a layered topology layout.
 *
 * Nodes are grouped into three layers (EDGE, BUSINESS_LOGIC, DATA_INFRA)
 * and arranged vertically. Each layer is laid out independently using dagre LR.
 */
export function buildLayeredGraphData(
  systems: SystemWithCounts[],
  dependencies: DependencyRecord[],
): GraphData {
  if (systems.length === 0) {
    return { nodes: [], edges: [] };
  }

  const systemIds = new Set(systems.map((s) => s.id));
  const layers = inferLayers(systems, dependencies);

  // Group systems by layer
  const layerGroups: Record<LayerName, SystemWithCounts[]> = {
    EDGE: [],
    BUSINESS_LOGIC: [],
    DATA_INFRA: [],
  };

  for (const system of systems) {
    const layer = layers.get(system.id) ?? "BUSINESS_LOGIC";
    layerGroups[layer].push(system);
  }

  // Build edges
  const rawEdges: GraphEdge[] = dependencies
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

  // Compute parallel offsets for edges sharing the same node pair
  const edges = assignParallelOffsets(rawEdges);

  // Layout each layer independently and stack vertically
  const allNodes: GraphNode[] = [];
  let currentY = 0;

  for (const layerName of LAYER_ORDER) {
    const layerSystems = layerGroups[layerName];
    if (layerSystems.length === 0) continue;

    const config = LAYER_CONFIG[layerName];

    // Add layer label node
    allNodes.push({
      id: `layer-label-${layerName}`,
      type: "layerLabel",
      position: { x: 0, y: currentY },
      data: {
        label: config.label,
        domain: "",
        language: null,
        framework: null,
        servicesCount: layerSystems.length,
        risksCount: 0,
        domainColor: config.color,
        layer: layerName,
      },
    });

    currentY += LAYER_LABEL_HEIGHT;

    // Run dagre layout for this layer's systems
    const graph = new dagre.graphlib.Graph();
    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph({
      rankdir: "LR",
      nodesep: VERTICAL_SEP,
      ranksep: HORIZONTAL_SEP,
    });

    for (const system of layerSystems) {
      graph.setNode(system.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    }

    // Only add edges that are within this layer
    const layerNodeIds = new Set(layerSystems.map((s) => s.id));
    for (const edge of edges) {
      if (layerNodeIds.has(edge.source) && layerNodeIds.has(edge.target)) {
        graph.setEdge(edge.source, edge.target);
      }
    }

    dagre.layout(graph);

    let maxLayerHeight = 0;

    for (const system of layerSystems) {
      const nodePos = graph.node(system.id) as dagre.Node | undefined;
      const x = nodePos?.x ?? 0;
      const y = nodePos?.y ?? 0;

      const layer = layers.get(system.id) ?? "BUSINESS_LOGIC";

      allNodes.push({
        id: system.id,
        type: "system",
        position: {
          x: x - NODE_WIDTH / 2,
          y: currentY + (y - NODE_HEIGHT / 2),
        },
        data: {
          label: system.name,
          domain: system.domain.name,
          language: system.language,
          framework: system.framework,
          servicesCount: system._count.services,
          risksCount: system._count.risks,
          domainColor: getDomainColor(system.domain.name),
          layer,
        },
      });

      maxLayerHeight = Math.max(maxLayerHeight, y + NODE_HEIGHT / 2);
    }

    currentY += maxLayerHeight + LAYER_GAP;
  }

  return { nodes: allNodes, edges };
}

/**
 * For edges sharing the same source–target pair, assign a vertical offset
 * so they fan out instead of stacking on top of each other.
 */
const PARALLEL_EDGE_GAP = 25;

function assignParallelOffsets(edges: GraphEdge[]): GraphEdge[] {
  const groups = new Map<string, GraphEdge[]>();

  for (const edge of edges) {
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
