"use client";

import { createContext, useContext } from "react";

interface GraphHoverState {
  hoveredEdgeId: string | null;
  highlightedSystemId?: string | null;
  focusedNodeId?: string | null;
  onHighlight?: (nodeId: string) => void;
  edgeOffsets: Record<string, number>;
  setEdgeOffset: (edgeId: string, offset: number) => void;
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
