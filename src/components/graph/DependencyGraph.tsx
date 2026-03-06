"use client";

import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type NodeMouseHandler,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import type { GraphData, GraphNode } from "@/modules/graph/types";
import { SystemNode } from "./SystemNode";
import { DependencyEdge } from "./DependencyEdge";
import { LayerLabelNode } from "./LayerLabelNode";
import { DomainGroupNode } from "./DomainGroupNode";
import { CollapsedDomainNode } from "./CollapsedDomainNode";
import { LayerGroupNode } from "./LayerGroupNode";
import { GraphHoverContext } from "./GraphHoverContext";
import type { EdgeOffset } from "./GraphHoverContext";
import styles from "./DependencyGraph.module.css";

const nodeTypes = {
  system: SystemNode,
  layerLabel: LayerLabelNode,
  domainGroup: DomainGroupNode,
  collapsedDomain: CollapsedDomainNode,
  layerGroup: LayerGroupNode,
};
const edgeTypes = { smoothstep: DependencyEdge };

const DIMMED_OPACITY = 0.08;

interface DependencyGraphProps {
  data: GraphData;
  onNodeClick?: (nodeId: string) => void;
  onHighlight?: (nodeId: string) => void;
  highlightedSystemId?: string | null;
  focusedNodeId?: string | null;
  onViewportChange?: (viewport: Viewport) => void;
  initialEdgeOffsets?: Record<string, EdgeOffset>;
  onNodePositionsChange?: (positions: Record<string, { x: number; y: number }>) => void;
  onEdgeOffsetsChange?: (offsets: Record<string, EdgeOffset>) => void;
}

export function DependencyGraph({
  data,
  onNodeClick,
  onHighlight,
  highlightedSystemId,
  focusedNodeId,
  onViewportChange,
  initialEdgeOffsets,
  onNodePositionsChange,
  onEdgeOffsetsChange,
}: DependencyGraphProps) {
  const { getNodes, screenToFlowPosition, getInternalNode } = useReactFlow();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);
  const isDark = mounted && resolvedTheme === "dark";

  const [nodes, setNodes, onNodesChange] = useNodesState(data.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(data.edges);

  // Per-edge XY offset state (for drag-to-move edge paths)
  const [edgeOffsets, setEdgeOffsets] = useState<Record<string, EdgeOffset>>(
    initialEdgeOffsets ?? {},
  );

  // When the layout mode switches the parent passes new initial offsets — reset
  const [prevInitial, setPrevInitial] = useState(initialEdgeOffsets);
  if (prevInitial !== initialEdgeOffsets) {
    setPrevInitial(initialEdgeOffsets);
    setEdgeOffsets(initialEdgeOffsets ?? {});
  }

  const setEdgeOffset = useCallback((edgeId: string, offset: EdgeOffset) => {
    setEdgeOffsets((prev) => ({ ...prev, [edgeId]: offset }));
  }, []);

  // Notify parent of offset changes (debounced so we don't hammer on every mouse move)
  const edgeOffsetsPersistRef = useRef(onEdgeOffsetsChange);
  useEffect(() => {
    edgeOffsetsPersistRef.current = onEdgeOffsetsChange;
  }, [onEdgeOffsetsChange]);
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!edgeOffsetsPersistRef.current) return;
    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => {
      edgeOffsetsPersistRef.current?.(edgeOffsets);
    }, 400);
    return () => {
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    };
  }, [edgeOffsets]);

  // Edge hover state
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  // Edge selection state (click to show popup)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedEdgeClickPos, setSelectedEdgeClickPos] = useState<{ x: number; y: number } | null>(null);

  const handleEdgeMouseEnter = useCallback(
    (_event: React.MouseEvent, edge: { id: string }) => {
      setHoveredEdgeId(edge.id);
    },
    [],
  );

  const handleEdgeMouseLeave = useCallback(() => {
    setHoveredEdgeId(null);
  }, []);

  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: { id: string }) => {
      const pos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setSelectedEdgeId((prev) => {
        if (prev === edge.id) {
          setSelectedEdgeClickPos(null);
          return null;
        }
        setSelectedEdgeClickPos(pos);
        return edge.id;
      });
    },
    [screenToFlowPosition],
  );

  const handlePaneClick = useCallback(() => {
    setSelectedEdgeId(null);
    setSelectedEdgeClickPos(null);
  }, []);

  const hoverContextValue = useMemo(
    () => ({
      hoveredEdgeId,
      highlightedSystemId,
      focusedNodeId,
      onHighlight,
      edgeOffsets,
      setEdgeOffset,
      selectedEdgeId,
      setSelectedEdgeId,
      selectedEdgeClickPos,
      setSelectedEdgeClickPos,
    }),
    [hoveredEdgeId, highlightedSystemId, focusedNodeId, onHighlight, edgeOffsets, setEdgeOffset, selectedEdgeId, selectedEdgeClickPos],
  );

  // ── Animated layout transition ───────────────────────
  // When the node set changes (e.g. clustering toggle), enable a CSS
  // transition on React Flow's internal node transform for 400ms.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prevNodeKeyRef = useRef<string>("");

  useLayoutEffect(() => {
    // Build a lightweight fingerprint of the current node ids + types
    const key = data.nodes.map((n) => `${n.id}:${n.type}`).join(",");
    const changed = prevNodeKeyRef.current !== "" && prevNodeKeyRef.current !== key;
    prevNodeKeyRef.current = key;

    if (changed && wrapperRef.current) {
      wrapperRef.current.classList.add(styles.animatingLayout!);
      const timer = setTimeout(() => {
        wrapperRef.current?.classList.remove(styles.animatingLayout!);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [data.nodes]);

  // ── Pull-to-highlight: enable CSS transition when highlight changes ──
  const pullingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useLayoutEffect(() => {
    if (!wrapperRef.current) return;
    wrapperRef.current.classList.add(styles.pullingNodes!);
    if (pullingTimeoutRef.current) clearTimeout(pullingTimeoutRef.current);
    pullingTimeoutRef.current = setTimeout(() => {
      wrapperRef.current?.classList.remove(styles.pullingNodes!);
    }, 700);
    return () => {
      if (pullingTimeoutRef.current) clearTimeout(pullingTimeoutRef.current);
    };
  }, [highlightedSystemId]);

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

      // Keep parent group nodes visible when they contain connected children
      for (const node of data.nodes) {
        const parentId = (node as GraphNode & { parentId?: string }).parentId;
        if (parentId && connectedNodeIds.has(node.id)) {
          connectedNodeIds.add(parentId);
        }
      }

      // Pull connected system nodes toward the highlighted node
      const hInternal = getInternalNode(highlightedSystemId);
      const hPos = hInternal?.internals.positionAbsolute;

      setNodes(
        data.nodes.map((node) => {
          const isConnected = connectedNodeIds.has(node.id);

          // Shift neighbor system nodes 40% closer in absolute space
          let position = node.position;
          if (isConnected && node.id !== highlightedSystemId && node.type === 'system' && hPos) {
            const nInternal = getInternalNode(node.id);
            const nPos = nInternal?.internals.positionAbsolute;
            if (nPos) {
              const PULL = 0.4;
              position = {
                x: node.position.x + (hPos.x - nPos.x) * PULL,
                y: node.position.y + (hPos.y - nPos.y) * PULL,
              };
            }
          }

          return {
            ...node,
            position,
            style: isConnected
              ? { transition: 'opacity 0.2s ease' }
              : { opacity: DIMMED_OPACITY, transition: 'opacity 0.2s ease' },
          };
        }),
      );

      setEdges(
        data.edges.map((edge) => {
          const isConnected = connectedEdgeIds.has(edge.id);
          return {
            ...edge,
            style: {
              ...edge.style,
              opacity: isConnected ? 1 : DIMMED_OPACITY,
              strokeWidth: isConnected ? 3.5 : (edge.style.strokeWidth ?? 2),
              transition: 'opacity 0.2s ease, stroke-width 0.2s ease',
            },
          };
        }),
      );
    } else if (selectedEdgeId) {
      const sel = data.edges.find((e) => e.id === selectedEdgeId);
      if (sel) {
        const connectedNodeIds = new Set([sel.source, sel.target]);
        setNodes(
          data.nodes.map((node) => ({
            ...node,
            style: connectedNodeIds.has(node.id)
              ? { transition: 'opacity 0.2s ease' }
              : { opacity: DIMMED_OPACITY, transition: 'opacity 0.2s ease' },
          })),
        );
        setEdges(
          data.edges.map((edge) => ({
            ...edge,
            style: {
              ...edge.style,
              opacity: edge.id === selectedEdgeId ? 1 : DIMMED_OPACITY,
              strokeWidth: edge.id === selectedEdgeId ? 3.5 : (edge.style.strokeWidth ?? 2),
              transition: 'opacity 0.2s ease, stroke-width 0.2s ease',
            },
          })),
        );
      }
    } else {
      setNodes(data.nodes);
      setEdges(data.edges);
    }
  }, [data, highlightedSystemId, selectedEdgeId, setNodes, setEdges]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick],
  );

  const handleNodeDragStop = useCallback(() => {
    if (!onNodePositionsChange) return;
    const positions: Record<string, { x: number; y: number }> = {};
    for (const n of getNodes()) {
      positions[n.id] = n.position;
    }
    onNodePositionsChange(positions);
  }, [getNodes, onNodePositionsChange]);

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
    <div ref={wrapperRef} className={styles.wrapper}>
      <GraphHoverContext.Provider value={hoverContextValue}>
        <ReactFlow
          colorMode={isDark ? "dark" : "light"}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onNodeDragStop={handleNodeDragStop}
          onMoveEnd={handleMoveEnd}
          onEdgeMouseEnter={handleEdgeMouseEnter}
          onEdgeMouseLeave={handleEdgeMouseLeave}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handlePaneClick}
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
