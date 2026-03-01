"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type NodeMouseHandler,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import type { GraphData } from "@/modules/graph/types";
import { SystemNode } from "./SystemNode";
import { DependencyEdge } from "./DependencyEdge";
import { LayerLabelNode } from "./LayerLabelNode";
import { DomainGroupNode } from "./DomainGroupNode";
import { CollapsedDomainNode } from "./CollapsedDomainNode";
import { GraphHoverContext } from "./GraphHoverContext";
import styles from "./DependencyGraph.module.css";

const nodeTypes = {
  system: SystemNode,
  layerLabel: LayerLabelNode,
  domainGroup: DomainGroupNode,
  collapsedDomain: CollapsedDomainNode,
};
const edgeTypes = { smoothstep: DependencyEdge };

const DIMMED_OPACITY = 0.15;

interface DependencyGraphProps {
  data: GraphData;
  onNodeClick?: (nodeId: string) => void;
  onHighlight?: (nodeId: string) => void;
  highlightedSystemId?: string | null;
  focusedNodeId?: string | null;
  onViewportChange?: (viewport: Viewport) => void;
}

export function DependencyGraph({
  data,
  onNodeClick,
  onHighlight,
  highlightedSystemId,
  focusedNodeId,
  onViewportChange,
}: DependencyGraphProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);
  const isDark = mounted && resolvedTheme === "dark";

  const [nodes, setNodes, onNodesChange] = useNodesState(data.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(data.edges);

  // Edge hover state
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  const handleEdgeMouseEnter = useCallback(
    (_event: React.MouseEvent, edge: { id: string }) => {
      setHoveredEdgeId(edge.id);
    },
    [],
  );

  const handleEdgeMouseLeave = useCallback(() => {
    setHoveredEdgeId(null);
  }, []);

  const hoverContextValue = useMemo(
    () => ({
      hoveredEdgeId,
      highlightedSystemId,
      focusedNodeId,
      onHighlight,
    }),
    [hoveredEdgeId, highlightedSystemId, focusedNodeId, onHighlight],
  );

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

  const handleMoveEnd = useCallback(
    (_event: MouseEvent | TouchEvent | null, viewport: Viewport) => {
      onViewportChange?.(viewport);
    },
    [onViewportChange],
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
      <GraphHoverContext.Provider value={hoverContextValue}>
        <ReactFlow
          colorMode={isDark ? "dark" : "light"}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onMoveEnd={handleMoveEnd}
          onEdgeMouseEnter={handleEdgeMouseEnter}
          onEdgeMouseLeave={handleEdgeMouseLeave}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          nodesDraggable
          nodesConnectable={false}
          edgesReconnectable={false}
        >
          <MiniMap pannable zoomable />
          <Controls />
          <Background
            variant={BackgroundVariant.Dots}
            color={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}
            gap={20}
            size={1.5}
          />
        </ReactFlow>
      </GraphHoverContext.Provider>
    </div>
  );
}
