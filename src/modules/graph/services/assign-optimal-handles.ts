import type { GraphNode, GraphEdge } from "../types";

const NODE_WIDTH = 250;
const NODE_HEIGHT = 100;
const SERVICE_PORT_HEIGHT = 24;

function getNodeHeight(servicesCount: number): number {
  if (servicesCount === 0) return NODE_HEIGHT;
  return NODE_HEIGHT + servicesCount * SERVICE_PORT_HEIGHT;
}

/**
 * Picks the handle ID on the side of the node that faces the given target point.
 * Uses the angle from node center to target center to determine the closest side.
 */
function pickHandle(
  prefix: "source" | "target",
  nodeCenterX: number,
  nodeCenterY: number,
  towardX: number,
  towardY: number,
): string {
  const dx = towardX - nodeCenterX;
  const dy = towardY - nodeCenterY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI); // -180 to 180

  if (angle >= -45 && angle < 45) return `${prefix}-right`;
  if (angle >= 45 && angle < 135) return `${prefix}-bottom`;
  if (angle >= -135 && angle < -45) return `${prefix}-top`;
  return `${prefix}-left`;
}

/**
 * For each edge, determines the best source/target handle based on the
 * relative positions of the connected nodes. This ensures edges exit from
 * the side of the node closest to the peer, preventing lines from routing
 * behind or through other nodes.
 *
 * Service-specific target handles (`svc-*`) are preserved as-is.
 *
 * @param nodes        All graph nodes (used to look up positions & sizes)
 * @param edges        Edges to process
 * @param absolutePos  Optional map of node ID → absolute position (for nodes
 *                     inside groups/clusters whose `position` is relative)
 */
export function assignOptimalHandles(
  nodes: GraphNode[],
  edges: GraphEdge[],
  absolutePos?: Map<string, { x: number; y: number }>,
): GraphEdge[] {
  const nodeMap = new Map<string, GraphNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  return edges.map((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    if (!sourceNode || !targetNode) return edge;

    const sPos = absolutePos?.get(edge.source) ?? sourceNode.position;
    const tPos = absolutePos?.get(edge.target) ?? targetNode.position;

    const sH = getNodeHeight(sourceNode.data.services?.length ?? 0);
    const tH = getNodeHeight(targetNode.data.services?.length ?? 0);

    const sCenterX = sPos.x + NODE_WIDTH / 2;
    const sCenterY = sPos.y + sH / 2;
    const tCenterX = tPos.x + NODE_WIDTH / 2;
    const tCenterY = tPos.y + tH / 2;

    const sourceHandle = pickHandle("source", sCenterX, sCenterY, tCenterX, tCenterY);

    // Keep service-specific target handles (on the left side)
    let targetHandle = edge.targetHandle;
    if (!targetHandle || !targetHandle.startsWith("svc-")) {
      targetHandle = pickHandle("target", tCenterX, tCenterY, sCenterX, sCenterY);
    }

    return { ...edge, sourceHandle, targetHandle };
  });
}
