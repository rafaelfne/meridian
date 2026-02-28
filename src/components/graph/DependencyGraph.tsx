"use client";

import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { GraphData } from "@/modules/graph/types";
import { SystemNode } from "./SystemNode";
import { DependencyEdge } from "./DependencyEdge";
import styles from "./DependencyGraph.module.css";

const nodeTypes = { system: SystemNode };
const edgeTypes = { smoothstep: DependencyEdge };

interface DependencyGraphProps {
  data: GraphData;
}

export function DependencyGraph({ data }: DependencyGraphProps) {
  const [nodes, , onNodesChange] = useNodesState(data.nodes);
  const [edges, , onEdgesChange] = useEdgesState(data.edges);

  if (data.nodes.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No systems to display.</p>
        <p>Upload an inventory to see the dependency graph.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        nodesDraggable
        nodesConnectable={false}
        edgesReconnectable={false}
      >
        <MiniMap />
        <Controls />
        <Background variant={BackgroundVariant.Dots} />
      </ReactFlow>
    </div>
  );
}
