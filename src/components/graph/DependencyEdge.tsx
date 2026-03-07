"use client";

import { useRef, useState, memo, useMemo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
  Position,
} from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import type { GraphEdgeData, GraphNodeData } from "@/modules/graph/types";
import { DEPENDENCY_TYPE_CONFIG } from "@/modules/graph/constants";
import { EdgeParticles } from "./EdgeParticles";
import { useEdgeInteraction } from "./GraphHoverContext";
import type { EdgeOffset } from "./GraphHoverContext";
import edgeStyles from "./DependencyEdge.module.css";

type DependencyEdgeProps = EdgeProps & { data: GraphEdgeData };

/**
 * Builds an orthogonal (step-style) SVG path between two handles.
 *
 * Adapts routing based on which sides of the nodes the handles are on:
 *
 *  - Both horizontal (Right→Left, Left→Right, etc.): Z-routing via a
 *    vertical middle channel.
 *  - Both vertical (Bottom→Top, Top→Bottom, etc.): Z-routing via a
 *    horizontal middle channel.
 *  - Mixed (horizontal→vertical or vertical→horizontal): L-routing with
 *    a single turn.
 *
 * offsetX / offsetY shift the intermediate routing channels (for user drag
 * and parallel-edge spreading).
 */
function buildStepPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePos: Position,
  targetPos: Position,
  offsetX = 0,
  offsetY = 0,
): [path: string, labelX: number, labelY: number] {
  const sHoriz =
    sourcePos === Position.Left || sourcePos === Position.Right;
  const tHoriz =
    targetPos === Position.Left || targetPos === Position.Right;

  if (sHoriz && tHoriz) {
    // ── Both exits horizontal: classic Z-routing ──────────
    const dx = targetX - sourceX;
    const absDx = Math.abs(dx) || 1;
    const gap = Math.max(30, absDx / 3);

    const sx =
      sourcePos === Position.Right ? sourceX + gap : sourceX - gap;
    const tx =
      targetPos === Position.Left ? targetX - gap : targetX + gap;

    const qX1 = sx + offsetX;
    const qX2 = tx + offsetX;
    const midY = (sourceY + targetY) / 2 + offsetY;

    const path = [
      `M ${sourceX},${sourceY}`,
      `L ${qX1},${sourceY}`,
      `L ${qX1},${midY}`,
      `L ${qX2},${midY}`,
      `L ${qX2},${targetY}`,
      `L ${targetX},${targetY}`,
    ].join(" ");

    return [path, (qX1 + qX2) / 2, midY];
  }

  if (!sHoriz && !tHoriz) {
    // ── Both exits vertical: rotated Z-routing ────────────
    const dy = targetY - sourceY;
    const absDy = Math.abs(dy) || 1;
    const gap = Math.max(30, absDy / 3);

    const sy =
      sourcePos === Position.Bottom ? sourceY + gap : sourceY - gap;
    const ty =
      targetPos === Position.Top ? targetY - gap : targetY + gap;

    const qY1 = sy + offsetY;
    const qY2 = ty + offsetY;
    const midX = (sourceX + targetX) / 2 + offsetX;

    const path = [
      `M ${sourceX},${sourceY}`,
      `L ${sourceX},${qY1}`,
      `L ${midX},${qY1}`,
      `L ${midX},${qY2}`,
      `L ${targetX},${qY2}`,
      `L ${targetX},${targetY}`,
    ].join(" ");

    return [path, midX, (qY1 + qY2) / 2];
  }

  if (sHoriz && !tHoriz) {
    // ── Source horizontal, target vertical: L-routing ─────
    const sx =
      sourcePos === Position.Right ? sourceX + 30 : sourceX - 30;
    const ty =
      targetPos === Position.Top ? targetY - 30 : targetY + 30;

    const path = [
      `M ${sourceX},${sourceY}`,
      `L ${sx + offsetX},${sourceY}`,
      `L ${sx + offsetX},${ty + offsetY}`,
      `L ${targetX},${ty + offsetY}`,
      `L ${targetX},${targetY}`,
    ].join(" ");

    return [path, (sx + offsetX + targetX) / 2, (sourceY + ty + offsetY) / 2];
  }

  // ── Source vertical, target horizontal: L-routing ───────
  const sy =
    sourcePos === Position.Bottom ? sourceY + 30 : sourceY - 30;
  const tx =
    targetPos === Position.Left ? targetX - 30 : targetX + 30;

  const path = [
    `M ${sourceX},${sourceY}`,
    `L ${sourceX},${sy + offsetY}`,
    `L ${tx + offsetX},${sy + offsetY}`,
    `L ${tx + offsetX},${targetY}`,
    `L ${targetX},${targetY}`,
  ].join(" ");

  return [path, (sourceX + tx + offsetX) / 2, (sy + offsetY + targetY) / 2];
}

/** Edge detail popup — only mounted when an edge is selected. */
function EdgePopup({
  source,
  target,
  data,
  strokeColor,
  clickPos,
}: {
  source: string;
  target: string;
  data: GraphEdgeData;
  strokeColor: string;
  clickPos: { x: number; y: number };
}) {
  const { getNode } = useReactFlow();
  const sourceNode = getNode(source);
  const targetNode = getNode(target);
  const sourceLabel = (sourceNode?.data as GraphNodeData | undefined)?.label ?? source;
  const targetLabel = (targetNode?.data as GraphNodeData | undefined)?.label ?? target;
  const typeConfig = DEPENDENCY_TYPE_CONFIG[data.type as keyof typeof DEPENDENCY_TYPE_CONFIG];
  const popupTypeLabel = typeConfig?.label ?? data.type.replace(/_/g, " ");
  const popupTypeColor = typeConfig?.color ?? strokeColor;

  return (
    <div
      className="nodrag nopan"
      style={{
        position: "absolute",
        transform: `translate(-50%, -100%) translate(${clickPos.x}px,${clickPos.y - 10}px)`,
        pointerEvents: "all",
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        whiteSpace: "nowrap",
        zIndex: 1000,
      }}
    >
      {/* Header: type badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 12px",
          borderBottom: "1px solid var(--border)",
          backgroundColor: `color-mix(in srgb, ${popupTypeColor} 12%, transparent)`,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: popupTypeColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            color: popupTypeColor,
            flex: 1,
            letterSpacing: "0.02em",
          }}
        >
          {popupTypeLabel}
        </span>
      </div>
      {/* Body */}
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Column headers: consumes / provides */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              flex: 1,
              fontSize: "0.5rem",
              fontWeight: 600,
              color: "var(--muted-foreground)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            consumer
          </span>
          <span style={{ width: "1rem", flexShrink: 0 }} />
          <span
            style={{
              flex: 1,
              fontSize: "0.5rem",
              fontWeight: 600,
              color: "var(--muted-foreground)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            provider
          </span>
        </div>
        {/* System names row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span
            style={{
              flex: 1,
              fontWeight: 700,
              fontSize: "0.875rem",
              color: "var(--foreground)",
              paddingTop: 1,
            }}
          >
            {sourceLabel}
          </span>
          <span
            style={{
              color: popupTypeColor,
              fontSize: "0.875rem",
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            →
          </span>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: "0.875rem",
                color: "var(--foreground)",
              }}
            >
              {targetLabel}
            </span>
            {data.targetServiceSlug && (
              <span
                style={{
                  fontSize: "0.625rem",
                  color: "var(--muted-foreground)",
                  letterSpacing: "0.02em",
                  fontWeight: 400,
                }}
              >
                {data.targetServiceSlug}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DependencyEdgeInner({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: DependencyEdgeProps) {
  const { hoveredEdgeId, edgeOffsets, setEdgeOffset, selectedEdgeId, selectedEdgeClickPos } = useEdgeInteraction();
  const { getViewport } = useReactFlow();
  const isHovered = hoveredEdgeId === id;
  const isSelected = selectedEdgeId === id;

  const userOffset: EdgeOffset = edgeOffsets[id] ?? { x: 0, y: 0 };
  const offsetX = userOffset.x;
  const offsetY = (data.parallelOffset ?? 0) + userOffset.y;

  const [edgePath, labelX, labelY] = useMemo(
    () => buildStepPath(sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, offsetX, offsetY),
    [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, offsetX, offsetY],
  );

  const strokeColor = (style?.stroke as string) ?? "#94a3b8";
  const baseWidth = (style?.strokeWidth as number) ?? 2;

  // Drag state
  const dragRef = useRef<{ startX: number; startY: number; startOffset: EdgeOffset } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent<SVGElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffset: userOffset };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGElement>) => {
    if (!dragRef.current) return;
    const { zoom } = getViewport();
    const dx = (e.clientX - dragRef.current.startX) / zoom;
    const dy = (e.clientY - dragRef.current.startY) / zoom;
    setEdgeOffset(id, {
      x: dragRef.current.startOffset.x + dx,
      y: dragRef.current.startOffset.y + dy,
    });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const midX = labelX;
  const midY = labelY;

  return (
    <>
      {isHovered && !data.dimmed && (
        <path
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={baseWidth + 6}
          strokeOpacity={0.3}
          className={edgeStyles.glowPath}
        />
      )}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          ...(data.solid ? {} : { strokeDasharray: "2 10" }),
          strokeWidth: isHovered && !data.dimmed ? baseWidth + 1 : baseWidth,
          transition: "stroke-width 0.15s ease",
        }}
      />
      {/* Wide transparent hit area over the full edge path for dragging */}
      {!data.dimmed && (
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={16}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="nodrag nopan"
        />
      )}
      {/* Visual indicator dot at midpoint — shows when hovered or offset active */}
      <circle
        cx={midX}
        cy={midY}
        r={4}
        fill={strokeColor}
        fillOpacity={isHovered || userOffset.x !== 0 || userOffset.y !== 0 ? 0.7 : 0}
        stroke="none"
        style={{ pointerEvents: "none" }}
      />
      {data.showParticles && (
        <EdgeParticles
          edgePath={edgePath}
          color={strokeColor}
          count={data.particleCount}
          duration={data.particleSpeed}
        />
      )}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
            fontSize: "0.625rem",
            fontWeight: 500,
            color: "var(--edge-label-color)",
            backgroundColor: "var(--background)",
            padding: "2px 6px",
            borderRadius: 4,
            zIndex: 1,
            opacity: style?.opacity != null ? Number(style.opacity) : 1,
            transition: "opacity 0.2s ease",
          }}
          className="nodrag nopan"
        >
          {data.label}
        </div>
        {/* "depends on" / "consumed by" labels — only mounted on hover/select */}
        {(isHovered || isSelected) && (
          <>
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${
                  sourcePosition === Position.Right ? sourceX + 48
                    : sourcePosition === Position.Left ? sourceX - 48
                    : sourceX
                }px,${
                  sourcePosition === Position.Bottom ? sourceY + 16
                    : sourcePosition === Position.Top ? sourceY - 16
                    : sourceY - 10
                }px)`,
                pointerEvents: "none",
                fontSize: "0.5rem",
                fontWeight: 600,
                color: strokeColor,
                backgroundColor: "color-mix(in srgb, var(--card) 90%, transparent)",
                padding: "1px 4px",
                borderRadius: 3,
                opacity: style?.opacity != null ? Number(style.opacity) : 1,
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
              }}
              className="nodrag nopan"
            >
              depends on
            </div>
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${
                  targetPosition === Position.Left ? targetX - 48
                    : targetPosition === Position.Right ? targetX + 48
                    : targetX
                }px,${
                  targetPosition === Position.Top ? targetY - 16
                    : targetPosition === Position.Bottom ? targetY + 16
                    : targetY - 10
                }px)`,
                pointerEvents: "none",
                fontSize: "0.5rem",
                fontWeight: 600,
                color: strokeColor,
                backgroundColor: "color-mix(in srgb, var(--card) 90%, transparent)",
                padding: "1px 4px",
                borderRadius: 3,
                opacity: style?.opacity != null ? Number(style.opacity) : 1,
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
              }}
              className="nodrag nopan"
            >
              consumed by
            </div>
          </>
        )}
        {/* Edge detail popup — shown on click */}
        {isSelected && selectedEdgeClickPos && (
          <EdgePopup
            source={source}
            target={target}
            data={data}
            strokeColor={strokeColor}
            clickPos={selectedEdgeClickPos}
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
}

export const DependencyEdge = memo(DependencyEdgeInner);
DependencyEdge.displayName = "DependencyEdge";
