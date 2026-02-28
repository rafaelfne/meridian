import type { GraphData, GraphNode } from "../types";

const GROUP_PADDING_X = 40;
const GROUP_PADDING_Y = 60;
const GROUP_PADDING_BOTTOM = 30;

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Wraps system nodes in domain group nodes using React Flow's parent/child
 * relationship. Each domain becomes a group node with its systems as children.
 *
 * Child nodes have their positions converted to relative coordinates.
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

  const groupNodes: GraphNode[] = [];
  const childNodes: GraphNode[] = [];

  for (const [domain, nodes] of domainGroups) {
    if (nodes.length === 0) continue;

    // Compute bounding box
    const bbox = computeBoundingBox(nodes);

    const groupId = `domain-group-${domain}`;
    const groupWidth = bbox.maxX - bbox.minX + GROUP_PADDING_X * 2;
    const groupHeight = bbox.maxY - bbox.minY + GROUP_PADDING_Y + GROUP_PADDING_BOTTOM;

    const domainColor = nodes[0]!.data.domainColor;

    // Create group node
    groupNodes.push({
      id: groupId,
      type: "domainGroup",
      position: {
        x: bbox.minX - GROUP_PADDING_X,
        y: bbox.minY - GROUP_PADDING_Y,
      },
      data: {
        label: domain,
        domain,
        language: null,
        framework: null,
        servicesCount: nodes.length,
        risksCount: nodes.reduce((sum, n) => sum + n.data.risksCount, 0),
        domainColor,
        width: groupWidth,
        height: groupHeight,
      },
    });

    // Convert children to relative positions
    for (const node of nodes) {
      childNodes.push({
        ...node,
        position: {
          x: node.position.x - (bbox.minX - GROUP_PADDING_X),
          y: node.position.y - (bbox.minY - GROUP_PADDING_Y),
        },
        parentId: groupId,
        extent: "parent" as const,
      } as GraphNode);
    }
  }

  // Include non-system nodes (e.g., layer labels) as-is
  const otherNodes = data.nodes.filter((n) => n.type !== "system");

  return {
    nodes: [...groupNodes, ...childNodes, ...otherNodes],
    edges: data.edges,
  };
}

function computeBoundingBox(nodes: GraphNode[]): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    // Assuming fixed node dimensions
    maxX = Math.max(maxX, node.position.x + 250);
    maxY = Math.max(maxY, node.position.y + 100);
  }

  return { minX, minY, maxX, maxY };
}
