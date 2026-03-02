"use client";

import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { GraphNodeData } from "@/modules/graph/types";
import { useGraphHover } from "./GraphHoverContext";
import styles from "./SystemNode.module.css";
import clsx from "clsx";
import { AlertTriangle, Waypoints } from "lucide-react";

type SystemNodeProps = NodeProps & { data: GraphNodeData };

export function SystemNode({ id, data, selected }: SystemNodeProps) {
  const { onHighlight, highlightedSystemId, focusedNodeId } = useGraphHover();

  const isHighlighted = highlightedSystemId === id;
  const isFocused = focusedNodeId === id;

  return (
    <div
      className={clsx(
        styles.node,
        selected && styles.selected,
        isHighlighted && styles.highlighted,
        isFocused && styles.focused,
      )}
      style={{ "--node-domain-color": data.domainColor } as React.CSSProperties}
    >      <Handle type="target" position={Position.Left} />

      <div className={styles.header}>
        <span className={styles.name} title={data.label}>
          {data.label}
        </span>
        <div className={styles.headerActions}>
          {onHighlight && (
            <button
              type="button"
              className={styles.highlightBtn}
              title="Highlight dependencies"
              onClick={(e) => {
                e.stopPropagation();
                onHighlight(id);
              }}
            >
              <Waypoints className="size-3" />
            </button>
          )}
          {data.risksCount > 0 && (
            <span className={styles.risk} title={`${data.risksCount} risk(s)`}>
              <AlertTriangle className="size-3" />
              {data.risksCount}
            </span>
          )}
        </div>
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
