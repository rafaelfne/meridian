"use client";

import { useEffect, useState, useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import type { GraphNode } from "@/modules/graph/types";
import clsx from "clsx";
import styles from "./GraphCommandSearch.module.css";

const NODE_WIDTH = 250;
const NODE_HEIGHT = 100;

interface GraphCommandSearchProps {
  nodes: GraphNode[];
  visibleNodeIds: Set<string>;
}

export function GraphCommandSearch({
  nodes,
  visibleNodeIds,
}: GraphCommandSearchProps) {
  const [open, setOpen] = useState(false);
  const { setCenter, getNodes } = useReactFlow();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function handleOpenSearch() {
      setOpen(true);
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("open-graph-search", handleOpenSearch);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("open-graph-search", handleOpenSearch);
    };
  }, []);

  const handleSelect = useCallback(
    (nodeId: string) => {
      // Use getNodes() to get the *current* position (accounts for drag-repositioning)
      const allNodes = getNodes();
      const current = allNodes.find((n) => n.id === nodeId);
      const fallback = nodes.find((n) => n.id === nodeId);
      const node = current ?? fallback;
      if (!node) return;

      // Compute absolute position by walking up the parent chain
      // (grouped nodes have positions relative to their parent)
      const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
      let absX = node.position.x;
      let absY = node.position.y;
      let parent = (node as { parentId?: string }).parentId
        ? nodeMap.get((node as { parentId?: string }).parentId!)
        : undefined;
      while (parent) {
        absX += parent.position.x;
        absY += parent.position.y;
        parent = (parent as { parentId?: string }).parentId
          ? nodeMap.get((parent as { parentId?: string }).parentId!)
          : undefined;
      }

      setCenter(absX + NODE_WIDTH / 2, absY + NODE_HEIGHT / 2, {
        zoom: 1.5,
        duration: 800,
      });
      setOpen(false);
    },
    [nodes, setCenter, getNodes],
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Go to system"
      description="Search for a system to navigate to"
      showCloseButton={false}
    >
      <CommandInput placeholder="Search systems…" />
      <CommandList>
        <CommandEmpty>No system found.</CommandEmpty>
        <CommandGroup heading="Systems">
          {nodes.map((node) => {
            const isVisible = visibleNodeIds.has(node.id);
            return (
              <CommandItem
                key={node.id}
                value={node.data.label}
                onSelect={() => handleSelect(node.id)}
                disabled={!isVisible}
                className={clsx(!isVisible && styles.filtered)}
              >
                <div className={styles.nodeItem}>
                  <span
                    className={styles.domainDot}
                    style={{ backgroundColor: node.data.domainColor }}
                  />
                  <span className={styles.nodeLabel}>{node.data.slug}</span>
                  <span className={styles.nodeMeta}>{node.data.domain}</span>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
