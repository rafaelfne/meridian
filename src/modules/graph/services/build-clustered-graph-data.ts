import dagre from "dagre";
import type { GraphData, GraphNode } from "../types";

const GROUP_PADDING_X = 40;
const GROUP_PADDING_Y = 60;
const GROUP_PADDING_BOTTOM = 30;

const NODE_WIDTH = 250;
const NODE_HEIGHT = 100;
const SERVICE_PORT_HEIGHT = 24;

/** Calculate node height based on the number of targeted services. */
function getNodeHeight(targetedServicesCount: number): number {
  if (targetedServicesCount === 0) return NODE_HEIGHT;
  return NODE_HEIGHT + targetedServicesCount * SERVICE_PORT_HEIGHT;
}

/** Gap between nodes inside a cluster */
const INNER_NODE_SEP = 40;
const INNER_RANK_SEP = 60;

/** Gap between cluster groups in the top-level layout */
const CLUSTER_SEP = 60;

/**
 * Wraps system nodes in domain group nodes using a two-phase layout:
 *
 * Phase 1 — Intra-cluster: each domain's nodes are laid out independently
 *           using dagre (only edges within the domain).
 * Phase 2 — Inter-cluster: domain groups are treated as single mega-nodes and
 *           laid out relative to each other using dagre (cross-domain edges).
 *
 * This avoids overlapping groups because every node is positioned strictly
 * inside its domain bounding box, and the boxes themselves are separated.
 */
export function buildClusteredGraphData(data: GraphData): GraphData {
  // Group system nodes by domain
  const domainGroups = new Map<string, GraphNode[]>();

  for (const node of data.nodes) {
    if (node.type !== "system") continue;
    const domain = node.data.domain;
    if (!domainGroups.has(domain)) {
      domainGroups.set(domain, []);
    }
    domainGroups.get(domain)!.push(node);
  }

  if (domainGroups.size === 0) return data;

  // Build a set of node→domain for quick lookup
  const nodeDomain = new Map<string, string>();
  for (const [domain, nodes] of domainGroups) {
    for (const n of nodes) {
      nodeDomain.set(n.id, domain);
    }
  }

  // ── Phase 1: Intra-cluster layout ──────────────────────
  // For each domain, run dagre only on that domain's nodes + internal edges.
  const intraPositions = new Map<string, Map<string, { x: number; y: number }>>();
  const clusterSizes = new Map<string, { width: number; height: number }>();

  for (const [domain, nodes] of domainGroups) {
    if (nodes.length === 0) continue;

    // Edges that are internal to this domain
    const internalEdges = data.edges.filter(
      (e) => nodeDomain.get(e.source) === domain && nodeDomain.get(e.target) === domain,
    );

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: "LR",
      nodesep: INNER_NODE_SEP,
      ranksep: INNER_RANK_SEP,
    });

    for (const node of nodes) {
      const height = getNodeHeight(node.data.services?.length ?? 0);
      g.setNode(node.id, { width: NODE_WIDTH, height });
    }
    for (const edge of internalEdges) {
      g.setEdge(edge.source, edge.target);
    }

    dagre.layout(g);

    // Read out positions (relative to 0,0 of the cluster)
    const positions = new Map<string, { x: number; y: number }>();
    let maxX = 0;
    let maxY = 0;

    for (const node of nodes) {
      const height = getNodeHeight(node.data.services?.length ?? 0);
      const pos = g.node(node.id) as dagre.Node | undefined;
      const x = (pos?.x ?? 0) - NODE_WIDTH / 2;
      const y = (pos?.y ?? 0) - height / 2;
      positions.set(node.id, { x, y });
      maxX = Math.max(maxX, x + NODE_WIDTH);
      maxY = Math.max(maxY, y + height);
    }

    intraPositions.set(domain, positions);
    clusterSizes.set(domain, {
      width: maxX + GROUP_PADDING_X * 2,
      height: maxY + GROUP_PADDING_Y + GROUP_PADDING_BOTTOM,
    });
  }

  // ── Phase 2: Inter-cluster layout ──────────────────────
  // Each cluster becomes a mega-node. Cross-domain edges connect the mega-nodes.
  const g2 = new dagre.graphlib.Graph();
  g2.setDefaultEdgeLabel(() => ({}));
  g2.setGraph({
    rankdir: "LR",
    nodesep: CLUSTER_SEP,
    ranksep: CLUSTER_SEP,
  });

  for (const [domain] of domainGroups) {
    const size = clusterSizes.get(domain)!;
    g2.setNode(domain, { width: size.width, height: size.height });
  }

  // Add cross-domain edges (deduplicated)
  const crossEdgeSet = new Set<string>();
  for (const edge of data.edges) {
    const srcDomain = nodeDomain.get(edge.source);
    const tgtDomain = nodeDomain.get(edge.target);
    if (srcDomain && tgtDomain && srcDomain !== tgtDomain) {
      const key = `${srcDomain}->${tgtDomain}`;
      if (!crossEdgeSet.has(key)) {
        crossEdgeSet.add(key);
        g2.setEdge(srcDomain, tgtDomain);
      }
    }
  }

  dagre.layout(g2);

  // Read cluster positions
  const clusterPositions = new Map<string, { x: number; y: number }>();
  for (const [domain] of domainGroups) {
    const pos = g2.node(domain) as dagre.Node | undefined;
    const size = clusterSizes.get(domain)!;
    clusterPositions.set(domain, {
      x: (pos?.x ?? 0) - size.width / 2,
      y: (pos?.y ?? 0) - size.height / 2,
    });
  }

  // ── Assemble final nodes ───────────────────────────────
  const groupNodes: GraphNode[] = [];
  const childNodes: GraphNode[] = [];

  for (const [domain, nodes] of domainGroups) {
    if (nodes.length === 0) continue;

    const clusterPos = clusterPositions.get(domain)!;
    const size = clusterSizes.get(domain)!;
    const positions = intraPositions.get(domain)!;
    const domainColor = nodes[0]!.data.domainColor;

    const groupId = `domain-group-${domain}`;

    groupNodes.push({
      id: groupId,
      type: "domainGroup",
      position: clusterPos,
      data: {
        label: domain,
        slug: domain,
        domain,
        language: null,
        framework: null,
        servicesCount: nodes.length,
        risksCount: nodes.reduce((sum, n) => sum + n.data.risksCount, 0),
        domainColor,
        width: size.width,
        height: size.height,
      },
    });

    for (const node of nodes) {
      const relativePos = positions.get(node.id)!;
      childNodes.push({
        ...node,
        position: {
          x: relativePos.x + GROUP_PADDING_X,
          y: relativePos.y + GROUP_PADDING_Y,
        },
        parentId: groupId,
        extent: "parent" as const,
      } as GraphNode);
    }
  }

  // Non-system nodes (e.g., layer labels) kept as-is
  const otherNodes = data.nodes.filter((n) => n.type !== "system");

  return {
    nodes: [...groupNodes, ...childNodes, ...otherNodes],
    edges: data.edges,
  };
}
