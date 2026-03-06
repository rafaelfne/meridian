"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { GraphNodeData } from "@/modules/graph/types";
import styles from "./LayerLabelNode.module.css";

type LayerLabelNodeProps = NodeProps & { data: GraphNodeData };

function LayerLabelNodeInner({ data }: LayerLabelNodeProps) {
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

export const LayerLabelNode = memo(LayerLabelNodeInner);
LayerLabelNode.displayName = "LayerLabelNode";
