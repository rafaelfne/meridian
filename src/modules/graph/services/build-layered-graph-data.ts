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
import { assignOptimalHandles } from "./assign-optimal-handles";

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

/** Padding inside layer group containers */
const GROUP_PADDING_X = 40;
const GROUP_PADDING_Y = 60;
const GROUP_PADDING_BOTTOM = 30;

/** Vertical gap between layer containers */
const LAYER_GAP = 100;

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
 * Each layer (EDGE, BUSINESS_LOGIC, DATA_INFRA) becomes a group container
 * node with its systems as children. Layers are stacked vertically,
 * and nodes within each layer are laid out using dagre LR.
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
          type: "arrowclosed",
          color: style.stroke,
          width: 12,
          height: 12,
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

  // ── Phase 1: Layout nodes inside each layer ────────────
  const layerInternalPositions = new Map<LayerName, Map<string, { x: number; y: number }>>();
  const layerContentSizes = new Map<LayerName, { width: number; height: number }>();

  for (const layerName of LAYER_ORDER) {
    const layerSystems = layerGroups[layerName];
    if (layerSystems.length === 0) continue;

    const graph = new dagre.graphlib.Graph();
    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph({
      rankdir: "LR",
      nodesep: VERTICAL_SEP,
      ranksep: HORIZONTAL_SEP,
    });

    for (const system of layerSystems) {
      const targeted = targetedServiceSlugs.get(system.id);
      const targetedCount = targeted && system.services
        ? system.services.filter((s) => targeted.has(s.slug)).length
        : 0;
      const height = getNodeHeight(targetedCount);
      graph.setNode(system.id, { width: NODE_WIDTH, height });
    }

    // Only add edges that are within this layer
    const layerNodeIds = new Set(layerSystems.map((s) => s.id));
    for (const edge of edges) {
      if (layerNodeIds.has(edge.source) && layerNodeIds.has(edge.target)) {
        graph.setEdge(edge.source, edge.target);
      }
    }

    dagre.layout(graph);

    const positions = new Map<string, { x: number; y: number }>();
    let maxX = 0;
    let maxY = 0;

    for (const system of layerSystems) {
      const targeted = targetedServiceSlugs.get(system.id);
      const targetedCount = targeted && system.services
        ? system.services.filter((s) => targeted.has(s.slug)).length
        : 0;
      const h = getNodeHeight(targetedCount);
      const pos = graph.node(system.id) as dagre.Node | undefined;
      const x = (pos?.x ?? 0) - NODE_WIDTH / 2;
      const y = (pos?.y ?? 0) - h / 2;
      positions.set(system.id, { x, y });
      maxX = Math.max(maxX, x + NODE_WIDTH);
      maxY = Math.max(maxY, y + h);
    }

    layerInternalPositions.set(layerName, positions);
    layerContentSizes.set(layerName, {
      width: maxX + GROUP_PADDING_X * 2,
      height: maxY + GROUP_PADDING_Y + GROUP_PADDING_BOTTOM,
    });
  }

  // ── Phase 2: Stack layers vertically ───────────────────
  // Find the widest layer to center-align all groups
  let maxGroupWidth = 0;
  for (const size of layerContentSizes.values()) {
    maxGroupWidth = Math.max(maxGroupWidth, size.width);
  }

  const allNodes: GraphNode[] = [];
  let currentY = 0;

  for (const layerName of LAYER_ORDER) {
    const layerSystems = layerGroups[layerName];
    if (layerSystems.length === 0) continue;

    const config = LAYER_CONFIG[layerName];
    const size = layerContentSizes.get(layerName)!;
    const positions = layerInternalPositions.get(layerName)!;

    // Use the widest layer width for all groups so they align
    const groupWidth = Math.max(size.width, maxGroupWidth);
    const groupHeight = size.height;
    const groupX = 0;
    const groupY = currentY;
    const groupId = `layer-group-${layerName}`;

    // Create group container
    allNodes.push({
      id: groupId,
      type: "layerGroup",
      position: { x: groupX, y: groupY },
      data: {
        label: config.label,
        slug: layerName,
        domain: "",
        language: null,
        framework: null,
        servicesCount: layerSystems.length,
        risksCount: 0,
        domainColor: config.color,
        width: groupWidth,
        height: groupHeight,
        layer: layerName,
      },
    });

    // Add child nodes with relative positions inside the group
    for (const system of layerSystems) {
      const relativePos = positions.get(system.id)!;
      const layer = layers.get(system.id) ?? "BUSINESS_LOGIC";
      const targeted = targetedServiceSlugs.get(system.id);
      const filteredServices = targeted && system.services
        ? system.services.filter((s) => targeted.has(s.slug))
        : undefined;

      allNodes.push({
        id: system.id,
        type: "system",
        position: {
          x: relativePos.x + GROUP_PADDING_X,
          y: relativePos.y + GROUP_PADDING_Y,
        },
        parentId: groupId,
        extent: "parent" as const,
        data: {
          label: system.name,
          slug: system.slug,
          domain: system.domain.name,
          language: system.language,
          framework: system.framework,
          servicesCount: system._count.services,
          risksCount: system._count.risks,
          domainColor: getDomainColor(system.domain.name),
          layer,
          services: filteredServices?.length ? filteredServices : undefined,
        },
      } as GraphNode);
    }

    currentY += groupHeight + LAYER_GAP;
  }

  // Compute absolute positions for system nodes inside layer groups
  const absolutePos = new Map<string, { x: number; y: number }>();
  for (const node of allNodes) {
    if (node.type !== "system") continue;
    const parent = allNodes.find((n) => n.id === (node as GraphNode & { parentId?: string }).parentId);
    if (parent) {
      absolutePos.set(node.id, {
        x: parent.position.x + node.position.x,
        y: parent.position.y + node.position.y,
      });
    } else {
      absolutePos.set(node.id, node.position);
    }
  }

  return { nodes: allNodes, edges: assignOptimalHandles(allNodes, edges, absolutePos) };
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
