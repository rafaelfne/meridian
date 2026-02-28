import type { GraphData, GraphNode, GraphEdge } from "../types";

/**
 * Collapses domain group nodes into single representative nodes.
 * All edges pointing to/from child nodes are remapped to the domain node.
 * Duplicate edges between domains are deduplicated.
 */
export function collapseDomainClusters(data: GraphData): GraphData {
  // Build parent lookup: childId -> groupId
  const childToGroup = new Map<string, string>();
  const groupNodes: GraphNode[] = [];
  const otherNodes: GraphNode[] = [];

  for (const node of data.nodes) {
    if (node.type === "domainGroup") {
      groupNodes.push(node);
    } else if ((node as GraphNode & { parentId?: string }).parentId) {
      const parentId = (node as GraphNode & { parentId?: string }).parentId!;
      childToGroup.set(node.id, parentId);
    } else {
      otherNodes.push(node);
    }
  }

  // If no groups found, return data unchanged
  if (groupNodes.length === 0) return data;

  // Create collapsed nodes from group nodes
  const collapsedNodes: GraphNode[] = groupNodes.map((group) => ({
    id: group.id,
    type: "collapsedDomain",
    position: group.position,
    data: group.data,
  }));

  // Remap and deduplicate edges
  const edgeSet = new Set<string>();
  const collapsedEdges: GraphEdge[] = [];

  for (const edge of data.edges) {
    const source = childToGroup.get(edge.source) ?? edge.source;
    const target = childToGroup.get(edge.target) ?? edge.target;

    // Skip self-loops within a domain group
    if (source === target) continue;

    // Deduplicate by source-target pair
    const key = `${source}->${target}`;
    if (edgeSet.has(key)) continue;
    edgeSet.add(key);

    collapsedEdges.push({
      ...edge,
      id: `collapsed-${key}`,
      source,
      target,
    });
  }

  return {
    nodes: [...collapsedNodes, ...otherNodes],
    edges: collapsedEdges,
  };
}
