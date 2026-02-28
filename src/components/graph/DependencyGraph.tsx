"use client";

import { useEffect, useCallback } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { GraphData } from "@/modules/graph/types";
import { SystemNode } from "./SystemNode";
import { DependencyEdge } from "./DependencyEdge";
import styles from "./DependencyGraph.module.css";

const nodeTypes = { system: SystemNode };
const edgeTypes = { smoothstep: DependencyEdge };

const DIMMED_OPACITY = 0.15;

interface DependencyGraphProps {
  data: GraphData;
  onNodeClick?: (nodeId: string) => void;
  highlightedSystemId?: string | null;
}

export function DependencyGraph({
  data,
  onNodeClick,
  highlightedSystemId,
}: DependencyGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(data.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(data.edges);

  // Sync nodes/edges when data changes (filtering) or highlighting changes
  useEffect(() => {
    if (highlightedSystemId) {
      const connectedNodeIds = new Set<string>([highlightedSystemId]);
      const connectedEdgeIds = new Set<string>();

      for (const edge of data.edges) {
        if (
          edge.source === highlightedSystemId ||
          edge.target === highlightedSystemId
        ) {
          connectedEdgeIds.add(edge.id);
          connectedNodeIds.add(edge.source);
          connectedNodeIds.add(edge.target);
        }
      }

      setNodes(
        data.nodes.map((node) => ({
          ...node,
          style: connectedNodeIds.has(node.id)
            ? undefined
            : { opacity: DIMMED_OPACITY },
        })),
      );

      setEdges(
        data.edges.map((edge) => ({
          ...edge,
          style: {
            ...edge.style,
            opacity: connectedEdgeIds.has(edge.id) ? 1 : DIMMED_OPACITY,
          },
        })),
      );
    } else {
      setNodes(data.nodes);
      setEdges(data.edges);
    }
  }, [data, highlightedSystemId, setNodes, setEdges]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick],
  );

  if (data.nodes.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No systems to display.</p>
        <p>Upload an inventory to see the dependency graph.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        nodesDraggable
        nodesConnectable={false}
        edgesReconnectable={false}
      >
        <MiniMap />
        <Controls />
        <Background variant={BackgroundVariant.Dots} />
      </ReactFlow>
    </div>
  );
}
