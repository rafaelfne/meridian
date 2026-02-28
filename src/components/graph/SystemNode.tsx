"use client";

import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { GraphNodeData } from "@/modules/graph/types";
import { useGraphHover } from "./GraphHoverContext";
import styles from "./SystemNode.module.css";
import clsx from "clsx";
import { AlertTriangle } from "lucide-react";

type SystemNodeProps = NodeProps & { data: GraphNodeData };

export function SystemNode({ id, data, selected }: SystemNodeProps) {
  const { onNodePointerDown, onNodePointerUp } = useGraphHover();

  return (
    <div
      className={clsx(styles.node, selected && styles.selected)}
      onPointerDown={onNodePointerDown ? () => onNodePointerDown(id) : undefined}
      onPointerUp={onNodePointerUp}
      onPointerLeave={onNodePointerUp}
    >
      <Handle type="target" position={Position.Left} />

      <div className={styles.header}>
        <span className={styles.name} title={data.label}>
          {data.label}
        </span>
        {data.risksCount > 0 && (
          <span className={styles.risk} title={`${data.risksCount} risk(s)`}>
            <AlertTriangle className="size-3" />
            {data.risksCount}
          </span>
        )}
      </div>

      <span
        className={styles.badge}
        style={{ backgroundColor: data.domainColor }}
      >
        {data.domain}
      </span>

      {data.language && <p className={styles.meta}>{data.language}</p>}

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
