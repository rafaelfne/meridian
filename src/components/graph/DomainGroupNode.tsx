"use client";

import type { NodeProps } from "@xyflow/react";
import type { GraphNodeData } from "@/modules/graph/types";
import styles from "./DomainGroupNode.module.css";

type DomainGroupNodeProps = NodeProps & {
  data: GraphNodeData & { width?: number; height?: number };
};

export function DomainGroupNode({ data }: DomainGroupNodeProps) {
  return (
    <div
      className={styles.group}
      style={{
        width: data.width ?? "100%",
        height: data.height ?? "100%",
        backgroundColor: `color-mix(in srgb, ${data.domainColor} 6%, transparent)`,
        borderColor: `color-mix(in srgb, ${data.domainColor} 25%, transparent)`,
      }}
    >
      <div className={styles.label} style={{ color: data.domainColor }}>
        {data.label}
        <span className={styles.count}>({data.servicesCount})</span>
      </div>
    </div>
  );
}
