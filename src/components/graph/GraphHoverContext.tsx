"use client";

import { createContext, useContext } from "react";

export interface EdgeOffset {
  x: number;
  y: number;
}

interface GraphHoverState {
  hoveredEdgeId: string | null;
  highlightedSystemId?: string | null;
  focusedNodeId?: string | null;
  onHighlight?: (nodeId: string) => void;
  edgeOffsets: Record<string, EdgeOffset>;
  setEdgeOffset: (edgeId: string, offset: EdgeOffset) => void;
}

const noop = () => { };

export const GraphHoverContext = createContext<GraphHoverState>({
  hoveredEdgeId: null,
  edgeOffsets: {},
  setEdgeOffset: noop,
});

export function useGraphHover() {
  return useContext(GraphHoverContext);
}
