"use client";

import { createContext, useContext } from "react";

interface GraphHoverState {
  hoveredEdgeId: string | null;
  onNodePointerDown?: (nodeId: string) => void;
  onNodePointerUp?: () => void;
}

export const GraphHoverContext = createContext<GraphHoverState>({
  hoveredEdgeId: null,
});

export function useGraphHover() {
  return useContext(GraphHoverContext);
}
