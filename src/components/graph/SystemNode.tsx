"use client";

import { memo, useState } from "react";
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

/** Maps datadogStatus to a CSS class and display label. */
function getStatusInfo(status: string | undefined | null, datadogServices?: { name: string; slug: string; status: string }[]): {
  cssClass: string;
  label: string;
} | null {
  if (!status) return null;

  // Check if all services are NOT_FOUND (coverage warning)
  if (status === "NOT_FOUND") {
    const allNotFound = !datadogServices || datadogServices.every((s) => s.status === "NOT_FOUND");
    if (allNotFound) return { cssClass: styles.statusNotFound!, label: "Not monitored" };
    return { cssClass: styles.statusNoData!, label: "No Data" };
  }

  switch (status) {
    case "OK":
      return { cssClass: styles.statusOk!, label: "OK" };
    case "WARN":
      return { cssClass: styles.statusWarn!, label: "Warn" };
    case "ALERT":
      return { cssClass: styles.statusAlert!, label: "Alert" };
    case "NO_DATA":
      return { cssClass: styles.statusNoData!, label: "No Data" };
    default:
      return null;
  }
}

function formatStatusLabel(status: string): string {
  switch (status) {
    case "OK": return "OK";
    case "WARN": return "Warn";
    case "ALERT": return "Alert";
    case "NO_DATA": return "No Data";
    case "NOT_FOUND": return "Not monitored";
    default: return status;
  }
}

function SystemNodeInner({ id, data, selected }: SystemNodeProps) {
  const { onHighlight, highlightedSystemId, focusedNodeId } = useNodeHighlight();
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const isHighlighted = highlightedSystemId === id;
  const isFocused = focusedNodeId === id;
  const showPorts = data.services && data.services.length > 0;

  const statusInfo = getStatusInfo(data.datadogStatus, data.datadogServices);

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
      {/* Target handles on all 4 sides */}
      <Handle type="target" position={Position.Top} id="target-top" className={styles.hiddenHandle} />
      <Handle type="target" position={Position.Right} id="target-right" className={styles.hiddenHandle} />
      <Handle type="target" position={Position.Bottom} id="target-bottom" className={styles.hiddenHandle} />
      <Handle type="target" position={Position.Left} id="target-left" className={styles.hiddenHandle} />

      <div className={styles.header}>
        <span className={styles.name} title={data.label}>
          {data.label}
        </span>
        <div className={styles.headerActions}>
          {statusInfo && (
            <div
              className={styles.statusContainer}
              onMouseEnter={() => setTooltipVisible(true)}
              onMouseLeave={() => setTooltipVisible(false)}
            >
              <span className={clsx(styles.statusDot, statusInfo.cssClass)}>
                <span className={styles.statusPulse} />
              </span>
              {tooltipVisible && data.datadogServices && (
                <div className={styles.statusTooltip}>
                  <div className={styles.tooltipHeader}>
                    <span className={styles.tooltipTitle}>{data.label}</span>
                    <span className={clsx(styles.tooltipStatus, statusInfo.cssClass)}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className={styles.tooltipServices}>
                    {data.datadogServices.map((svc) => (
                      <div key={svc.slug} className={styles.tooltipServiceRow}>
                        <span className={styles.tooltipServiceName}>{svc.name}</span>
                        <span className={clsx(
                          styles.tooltipServiceStatus,
                          styles[`status${svc.status.charAt(0)}${svc.status.slice(1).toLowerCase()}` as keyof typeof styles] ?? styles.statusNoData,
                        )}>
                          {formatStatusLabel(svc.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {data.datadogStatusUpdatedAt && (
                    <div className={styles.tooltipFooter}>
                      Last polled {new Date(data.datadogStatusUpdatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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

      {/* Source handles on all 4 sides */}
      <Handle type="source" position={Position.Top} id="source-top" className={styles.hiddenHandle} />
      <Handle type="source" position={Position.Right} id="source-right" className={styles.hiddenHandle} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" className={styles.hiddenHandle} />
      <Handle type="source" position={Position.Left} id="source-left" className={styles.hiddenHandle} />
    </div>
  );
}

export const SystemNode = memo(SystemNodeInner);
SystemNode.displayName = "SystemNode";
