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
  const { setCenter } = useReactFlow();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Compute connected nodes (excluding the highlighted node itself)
  const connectedNodes = useMemo(() => {
    if (!highlightedSystemId) return [];

    const connectedIds = new Set<string>();
    for (const edge of edges) {
      if (edge.source === highlightedSystemId) {
        connectedIds.add(edge.target);
      } else if (edge.target === highlightedSystemId) {
        connectedIds.add(edge.source);
      }
    }

    return nodes.filter((n) => connectedIds.has(n.id));
  }, [highlightedSystemId, nodes, edges]);

  // Find the highlighted node for display
  const highlightedNode = useMemo(
    () => nodes.find((n) => n.id === highlightedSystemId) ?? null,
    [nodes, highlightedSystemId],
  );

  // Reset index when highlighted system changes
  useEffect(() => {
    setCurrentIndex(0);
    if (!highlightedSystemId) {
      onFocusNode?.(null);
    }
  }, [highlightedSystemId, onFocusNode]);

  // Navigate viewport to node
  const navigateTo = useCallback(
    (index: number) => {
      const node = connectedNodes[index];
      if (!node) return;
      onFocusNode?.(node.id);
      setCenter(
        node.position.x + NODE_WIDTH / 2,
        node.position.y + NODE_HEIGHT / 2,
        { zoom: 1.5, duration: 600 },
      );
    },
    [connectedNodes, setCenter, onFocusNode],
  );

  const goNext = useCallback(() => {
    if (connectedNodes.length === 0) return;
    const next = (currentIndex + 1) % connectedNodes.length;
    setCurrentIndex(next);
    navigateTo(next);
  }, [currentIndex, connectedNodes.length, navigateTo]);

  const goPrev = useCallback(() => {
    if (connectedNodes.length === 0) return;
    const prev =
      (currentIndex - 1 + connectedNodes.length) % connectedNodes.length;
    setCurrentIndex(prev);
    navigateTo(prev);
  }, [currentIndex, connectedNodes.length, navigateTo]);

  // Keyboard navigation
  useEffect(() => {
    if (!highlightedSystemId || connectedNodes.length === 0) return;

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
  }, [highlightedSystemId, connectedNodes.length, goNext, goPrev]);

  if (!highlightedSystemId || connectedNodes.length === 0) return null;

  const current = connectedNodes[currentIndex];
  if (!current) return null;

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
        onClick={() => onNodeClick?.(current.id)}
        title="Open details"
      >
        <span
          className={styles.domainDot}
          style={{ backgroundColor: current.data.domainColor }}
        />
        <span className={styles.nodeName}>{current.data.label}</span>
        <span className={styles.counter}>
          {currentIndex + 1}/{connectedNodes.length}
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
