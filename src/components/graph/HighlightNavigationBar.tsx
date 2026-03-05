"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useReactFlow } from "@xyflow/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GraphNode, GraphEdge } from "@/modules/graph/types";
import styles from "./HighlightNavigationBar.module.css";

const NODE_WIDTH = 250;
const NODE_HEIGHT = 100;

interface HighlightNavigationBarProps {
  highlightedSystemId: string | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: string) => void;
  onFocusNode?: (nodeId: string | null) => void;
}

export function HighlightNavigationBar({
  highlightedSystemId,
  nodes,
  edges,
  onNodeClick,
  onFocusNode,
}: HighlightNavigationBarProps) {
  const { setCenter, getInternalNode } = useReactFlow();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Build navigation list: origin node at index 0, then its connected dependencies
  const navigationNodes = useMemo(() => {
    if (!highlightedSystemId) return [];

    const originNode = nodes.find((n) => n.id === highlightedSystemId);
    if (!originNode) return [];

    const connectedIds = new Set<string>();
    for (const edge of edges) {
      if (edge.source === highlightedSystemId) {
        connectedIds.add(edge.target);
      } else if (edge.target === highlightedSystemId) {
        connectedIds.add(edge.source);
      }
    }

    const deps = nodes.filter((n) => connectedIds.has(n.id));
    return [originNode, ...deps];
  }, [highlightedSystemId, nodes, edges]);

  // The highlighted node is always the first in the navigation list
  const highlightedNode = navigationNodes[0] ?? null;

  // Reset index when highlighted system changes
  useEffect(() => {
    const id = setTimeout(() => {
      setCurrentIndex(0);
      if (!highlightedSystemId) {
        onFocusNode?.(null);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [highlightedSystemId, onFocusNode]);

  // Navigate viewport to node
  const navigateTo = useCallback(
    (index: number) => {
      const node = navigationNodes[index];
      if (!node) return;
      // At origin (index 0): clear focusedNodeId so the node keeps its green
      // .highlighted style instead of getting the blue .focused overlay.
      onFocusNode?.(index === 0 ? null : node.id);
      // Use internal node for absolute position (accounts for parent offsets in cluster mode)
      const rfNode = getInternalNode(node.id);
      const pos = rfNode?.internals.positionAbsolute ?? node.position;
      const width = (rfNode?.measured?.width ?? NODE_WIDTH);
      const height = (rfNode?.measured?.height ?? NODE_HEIGHT);
      setCenter(
        pos.x + width / 2,
        pos.y + height / 2,
        { zoom: 1.5, duration: 600 },
      );
    },
    [navigationNodes, setCenter, getInternalNode, onFocusNode],
  );

  const goNext = useCallback(() => {
    if (navigationNodes.length <= 1) return;
    const next = (currentIndex + 1) % navigationNodes.length;
    setCurrentIndex(next);
    navigateTo(next);
  }, [currentIndex, navigationNodes.length, navigateTo]);

  const goPrev = useCallback(() => {
    if (navigationNodes.length <= 1) return;
    const prev = (currentIndex - 1 + navigationNodes.length) % navigationNodes.length;
    setCurrentIndex(prev);
    navigateTo(prev);
  }, [currentIndex, navigationNodes.length, navigateTo]);

  // Keyboard navigation
  useEffect(() => {
    if (!highlightedSystemId || navigationNodes.length <= 1) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [highlightedSystemId, navigationNodes.length, goNext, goPrev]);

  if (!highlightedSystemId || navigationNodes.length <= 1) return null;

  const current = navigationNodes[currentIndex] ?? null;

  return (
    <div className={styles.bar}>
      {highlightedNode && (
        <span className={styles.origin}>
          <span
            className={styles.domainDot}
            style={{ backgroundColor: highlightedNode.data.domainColor }}
          />
          <span className={styles.originName}>
            {highlightedNode.data.label}
          </span>
        </span>
      )}

      <span className={styles.separator} />

      <button
        type="button"
        className={styles.navButton}
        onClick={goPrev}
        title="Previous dependency"
      >
        <ChevronLeft className="size-4" />
      </button>

      <button
        type="button"
        className={styles.center}
        onClick={() => current && onNodeClick?.(current.id)}
        title={current ? "Open details" : "Navigate to browse dependencies"}
      >
        {current && (
          <span
            className={styles.domainDot}
            style={{ backgroundColor: current.data.domainColor }}
          />
        )}
        <span className={styles.nodeName}>
          {current ? current.data.label : "—"}
        </span>
        <span className={styles.counter}>
          {currentIndex + 1}/{navigationNodes.length}
        </span>
      </button>

      <button
        type="button"
        className={styles.navButton}
        onClick={goNext}
        title="Next dependency"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
