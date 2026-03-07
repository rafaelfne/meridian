"use client";

import { createContext, useContext } from "react";

export interface EdgeOffset {
  x: number;
  y: number;
}

// ── Node Highlight Context ──────────────────────────────────
// Consumed by SystemNode only — changes when highlight/focus state changes.

interface NodeHighlightState {
  highlightedSystemId?: string | null;
  focusedNodeId?: string | null;
  onHighlight?: (nodeId: string) => void;
}

export const NodeHighlightContext = createContext<NodeHighlightState>({});

export function useNodeHighlight() {
  return useContext(NodeHighlightContext);
}

// ── Edge Interaction Context ────────────────────────────────
// Consumed by DependencyEdge only — changes on hover, drag, and selection.

/** Axis-aligned bounding box for a node (absolute coordinates). */
export interface NodeRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface EdgeInteractionState {
  hoveredEdgeId: string | null;
  edgeOffsets: Record<string, EdgeOffset>;
  setEdgeOffset: (edgeId: string, offset: EdgeOffset) => void;
  selectedEdgeId: string | null;
  setSelectedEdgeId: (edgeId: string | null) => void;
  selectedEdgeClickPos: { x: number; y: number } | null;
  setSelectedEdgeClickPos: (pos: { x: number; y: number } | null) => void;
  /** Bounding boxes for all system nodes (absolute coords). */
  nodeRects: NodeRect[];
}

const noop = () => { };

export const EdgeInteractionContext = createContext<EdgeInteractionState>({
  hoveredEdgeId: null,
  edgeOffsets: {},
  setEdgeOffset: noop,
  selectedEdgeId: null,
  setSelectedEdgeId: noop,
  selectedEdgeClickPos: null,
  setSelectedEdgeClickPos: noop,
  nodeRects: [],
});

export function useEdgeInteraction() {
  return useContext(EdgeInteractionContext);
}
