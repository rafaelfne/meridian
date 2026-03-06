"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { GraphNodeData } from "@/modules/graph/types";
import styles from "./CollapsedDomainNode.module.css";

type CollapsedDomainNodeProps = NodeProps & { data: GraphNodeData };

function CollapsedDomainNodeInner({ data }: CollapsedDomainNodeProps) {
  return (
    <div
      className={styles.collapsed}
      style={{ borderColor: data.domainColor }}
    >
      <Handle type="target" position={Position.Left} />
      <span className={styles.name} style={{ color: data.domainColor }}>
        {data.label}
      </span>
      <span className={styles.count}>
        {data.servicesCount} system{data.servicesCount !== 1 ? "s" : ""}
      </span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const CollapsedDomainNode = memo(CollapsedDomainNodeInner);
CollapsedDomainNode.displayName = "CollapsedDomainNode";
