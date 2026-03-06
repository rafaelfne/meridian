"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { GraphNodeData } from "@/modules/graph/types";
import styles from "./LayerGroupNode.module.css";

type LayerGroupNodeProps = NodeProps & {
  data: GraphNodeData & { width?: number; height?: number };
};

function LayerGroupNodeInner({ data }: LayerGroupNodeProps) {
  return (
    <div
      className={styles.group}
      style={{
        width: data.width ?? "100%",
        height: data.height ?? "100%",
        backgroundColor: `color-mix(in srgb, ${data.domainColor} 5%, transparent)`,
        borderColor: `color-mix(in srgb, ${data.domainColor} 20%, transparent)`,
      }}
    >
      <div className={styles.label} style={{ color: data.domainColor }}>
        <span
          className={styles.dot}
          style={{ backgroundColor: data.domainColor }}
        />
        {data.label}
        <span className={styles.count}>({data.servicesCount})</span>
      </div>
    </div>
  );
}

export const LayerGroupNode = memo(LayerGroupNodeInner);
LayerGroupNode.displayName = "LayerGroupNode";
