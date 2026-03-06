"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { GraphNodeData } from "@/modules/graph/types";
import { useNodeHighlight } from "./GraphHoverContext";
import styles from "./SystemNode.module.css";
import clsx from "clsx";
import { AlertTriangle, Waypoints } from "lucide-react";

type SystemNodeProps = NodeProps & { data: GraphNodeData };

/** Service type → abbreviated label */
function svcTypeLabel(type: string): string {
  switch (type) {
    case "API":
      return "API";
    case "WORKER":
      return "WKR";
    case "CRONJOB":
      return "CRON";
    case "BACKGROUND_SERVICE":
      return "BG";
    default:
      return type.slice(0, 3).toUpperCase();
  }
}

function SystemNodeInner({ id, data, selected }: SystemNodeProps) {
  const { onHighlight, highlightedSystemId, focusedNodeId } = useNodeHighlight();

  const isHighlighted = highlightedSystemId === id;
  const isFocused = focusedNodeId === id;
  const showPorts = data.services && data.services.length > 0;

  return (
    <div
      className={clsx(
        styles.node,
        selected && styles.selected,
        isHighlighted && styles.highlighted,
        isFocused && styles.focused,
        showPorts && styles.withPorts,
      )}
      style={{ "--node-domain-color": data.domainColor } as React.CSSProperties}
    >
      <Handle type="target" position={Position.Left} />

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

      {showPorts && (
        <div className={styles.servicePorts}>
          {data.services!.map((svc) => (
            <div key={svc.slug} className={styles.servicePort}>
              <Handle
                type="target"
                position={Position.Left}
                id={`svc-${svc.slug}`}
                className={styles.serviceHandle}
              />
              <span className={styles.serviceTypeTag}>{svcTypeLabel(svc.type)}</span>
              <span className={styles.serviceName} title={svc.slug}>
                {svc.slug}
              </span>
            </div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const SystemNode = memo(SystemNodeInner);
SystemNode.displayName = "SystemNode";
