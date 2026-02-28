"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { GraphData } from "@/modules/graph/types";
import { SystemDetailPanel } from "@/components/graph/SystemDetailPanel";

export default function GraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGraph() {
      try {
        const res = await fetch("/api/graph");
        const json = (await res.json()) as { data: GraphData };
        setNodes(json.data.nodes as unknown as Node[]);
        setEdges(json.data.edges as unknown as Edge[]);
      } catch (err) {
        console.error("Failed to fetch graph:", err);
      } finally {
        setLoading(false);
      }
    }
    void fetchGraph();
  }, [setNodes, setEdges]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      setSelectedSystemId(node.id);
    },
    [],
  );

  const handleClosePanel = useCallback(() => {
    setSelectedSystemId(null);
    // Reset any highlighting
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: { ...e.style, opacity: 1 },
      })),
    );
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: { ...n.style, opacity: 1 },
      })),
    );
  }, [setEdges, setNodes]);

  const handleHighlightDependencies = useCallback(
    (systemId: string) => {
      setEdges((eds) =>
        eds.map((e) => {
          const isRelated = e.source === systemId || e.target === systemId;
          return {
            ...e,
            style: { ...e.style, opacity: isRelated ? 1 : 0.15 },
          };
        }),
      );
      setNodes((nds) =>
        nds.map((n) => {
          const isSelected = n.id === systemId;
          const isNeighbor = edges.some(
            (e) =>
              (e.source === systemId && e.target === n.id) ||
              (e.target === systemId && e.source === n.id),
          );
          return {
            ...n,
            style: {
              ...n.style,
              opacity: isSelected || isNeighbor ? 1 : 0.25,
            },
          };
        }),
      );
    },
    [edges, setEdges, setNodes],
  );

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted-foreground">Loading graph…</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} />
      </ReactFlow>

      <SystemDetailPanel
        systemId={selectedSystemId}
        onClose={handleClosePanel}
        onHighlightDependencies={handleHighlightDependencies}
      />
    </div>
  );
}
