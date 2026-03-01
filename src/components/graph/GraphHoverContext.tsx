"use client";

import { createContext, useContext } from "react";

interface GraphHoverState {
  hoveredEdgeId: string | null;
  highlightedSystemId?: string | null;
  focusedNodeId?: string | null;
  onHighlight?: (nodeId: string) => void;
}

export const GraphHoverContext = createContext<GraphHoverState>({
  hoveredEdgeId: null,
});

export function useGraphHover() {
  return useContext(GraphHoverContext);
}
