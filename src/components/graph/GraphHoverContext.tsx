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

interface EdgeInteractionState {
  hoveredEdgeId: string | null;
  edgeOffsets: Record<string, EdgeOffset>;
  setEdgeOffset: (edgeId: string, offset: EdgeOffset) => void;
  selectedEdgeId: string | null;
  setSelectedEdgeId: (edgeId: string | null) => void;
  selectedEdgeClickPos: { x: number; y: number } | null;
  setSelectedEdgeClickPos: (pos: { x: number; y: number } | null) => void;
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
});

export function useEdgeInteraction() {
  return useContext(EdgeInteractionContext);
}
