"use client";

import type { NodeProps } from "@xyflow/react";
import type { GraphNodeData } from "@/modules/graph/types";
import styles from "./LayerLabelNode.module.css";

type LayerLabelNodeProps = NodeProps & { data: GraphNodeData };

export function LayerLabelNode({ data }: LayerLabelNodeProps) {
  return (
    <div className={styles.label} style={{ color: data.domainColor }}>
      <span
        className={styles.dot}
        style={{ backgroundColor: data.domainColor }}
      />
      {data.label}
      <span className={styles.count}>({data.servicesCount})</span>
    </div>
  );
}
