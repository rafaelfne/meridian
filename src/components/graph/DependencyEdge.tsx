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
import type { EdgeOffset, NodeRect } from "./GraphHoverContext";
import edgeStyles from "./DependencyEdge.module.css";

type DependencyEdgeProps = EdgeProps & { data: GraphEdgeData };

// ── Obstacle avoidance helpers ──────────────────────────

/** Minimum clearance (px) between a routing channel and a node edge. */
const ROUTE_PAD = 12;

/**
 * Find a clear Y for a horizontal routing channel that spans [xLo..xHi].
 * Returns `defaultY` when it's already clear; otherwise shifts just
 * above or below the nearest blocking node.
 */
function clearY(
  defaultY: number,
  xLo: number,
  xHi: number,
  obstacles: NodeRect[],
): number {
  const lo = Math.min(xLo, xHi);
  const hi = Math.max(xLo, xHi);

  const rel = obstacles.filter(
    (r) => hi >= r.x - ROUTE_PAD && lo <= r.x + r.w + ROUTE_PAD,
  );
  if (rel.length === 0) return defaultY;

  const isClear = (y: number) =>
    rel.every((r) => y < r.y - ROUTE_PAD || y > r.y + r.h + ROUTE_PAD);

  if (isClear(defaultY)) return defaultY;

  // Candidates: edges of each blocking rect
  let best = defaultY;
  let bestDist = Infinity;
  for (const r of rel) {
    for (const cy of [r.y - ROUTE_PAD - 1, r.y + r.h + ROUTE_PAD + 1]) {
      if (isClear(cy) && Math.abs(cy - defaultY) < bestDist) {
        bestDist = Math.abs(cy - defaultY);
        best = cy;
      }
    }
  }

  // Fallback: go fully above or below all blockers
  if (bestDist === Infinity) {
    const above = Math.min(...rel.map((r) => r.y)) - ROUTE_PAD - 30;
    const below = Math.max(...rel.map((r) => r.y + r.h)) + ROUTE_PAD + 30;
    best =
      Math.abs(above - defaultY) < Math.abs(below - defaultY)
        ? above
        : below;
  }

  return best;
}

/** Same logic transposed — find a clear X for a vertical channel [yLo..yHi]. */
function clearX(
  defaultX: number,
  yLo: number,
  yHi: number,
  obstacles: NodeRect[],
): number {
  const lo = Math.min(yLo, yHi);
  const hi = Math.max(yLo, yHi);

  const rel = obstacles.filter(
    (r) => hi >= r.y - ROUTE_PAD && lo <= r.y + r.h + ROUTE_PAD,
  );
  if (rel.length === 0) return defaultX;

  const isClear = (x: number) =>
    rel.every((r) => x < r.x - ROUTE_PAD || x > r.x + r.w + ROUTE_PAD);

  if (isClear(defaultX)) return defaultX;

  let best = defaultX;
  let bestDist = Infinity;
  for (const r of rel) {
    for (const cx of [r.x - ROUTE_PAD - 1, r.x + r.w + ROUTE_PAD + 1]) {
      if (isClear(cx) && Math.abs(cx - defaultX) < bestDist) {
        bestDist = Math.abs(cx - defaultX);
        best = cx;
      }
    }
  }

  if (bestDist === Infinity) {
    const left = Math.min(...rel.map((r) => r.x)) - ROUTE_PAD - 30;
    const right = Math.max(...rel.map((r) => r.x + r.w)) + ROUTE_PAD + 30;
    best =
      Math.abs(left - defaultX) < Math.abs(right - defaultX) ? left : right;
  }

  return best;
}

// ── Path builder ────────────────────────────────────────

/**
 * Builds an orthogonal (step-style) SVG path between two handles,
 * routing around intermediate nodes so lines never cross over them.
 *
 * Routing shape depends on handle sides:
 *  - Both horizontal → Z-routing (H–V–H–V–H)
 *  - Both vertical   → Z-routing rotated 90° (V–H–V–H–V)
 *  - Mixed           → L-routing (3 segments)
 */
function buildStepPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePos: Position,
  targetPos: Position,
  offsetX: number,
  offsetY: number,
  obstacles: NodeRect[],
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

    let qX1 =
      (sourcePos === Position.Right ? sourceX + gap : sourceX - gap) + offsetX;
    let qX2 =
      (targetPos === Position.Left ? targetX - gap : targetX + gap) + offsetX;
    let midY = (sourceY + targetY) / 2 + offsetY;

    // Shift horizontal channel to a clear row
    midY = clearY(midY, qX1, qX2, obstacles);
    // Shift vertical turns to clear columns
    qX1 = clearX(qX1, sourceY, midY, obstacles);
    qX2 = clearX(qX2, midY, targetY, obstacles);

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

    let qY1 =
      (sourcePos === Position.Bottom ? sourceY + gap : sourceY - gap) + offsetY;
    let qY2 =
      (targetPos === Position.Top ? targetY - gap : targetY + gap) + offsetY;
    let midX = (sourceX + targetX) / 2 + offsetX;

    midX = clearX(midX, qY1, qY2, obstacles);
    qY1 = clearY(qY1, sourceX, midX, obstacles);
    qY2 = clearY(qY2, midX, targetX, obstacles);

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
    let sx =
      (sourcePos === Position.Right ? sourceX + 30 : sourceX - 30) + offsetX;
    let ty =
      (targetPos === Position.Top ? targetY - 30 : targetY + 30) + offsetY;

    sx = clearX(sx, sourceY, ty, obstacles);
    ty = clearY(ty, sx, targetX, obstacles);

    const path = [
      `M ${sourceX},${sourceY}`,
      `L ${sx},${sourceY}`,
      `L ${sx},${ty}`,
      `L ${targetX},${ty}`,
      `L ${targetX},${targetY}`,
    ].join(" ");

    return [path, (sx + targetX) / 2, (sourceY + ty) / 2];
  }

  // ── Source vertical, target horizontal: L-routing ───────
  let sy =
    (sourcePos === Position.Bottom ? sourceY + 30 : sourceY - 30) + offsetY;
  let tx =
    (targetPos === Position.Left ? targetX - 30 : targetX + 30) + offsetX;

  sy = clearY(sy, sourceX, tx, obstacles);
  tx = clearX(tx, sy, targetY, obstacles);

  const path = [
    `M ${sourceX},${sourceY}`,
    `L ${sourceX},${sy}`,
    `L ${tx},${sy}`,
    `L ${tx},${targetY}`,
    `L ${targetX},${targetY}`,
  ].join(" ");

  return [path, (sourceX + tx) / 2, (sy + targetY) / 2];
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
  const { hoveredEdgeId, edgeOffsets, setEdgeOffset, selectedEdgeId, selectedEdgeClickPos, nodeRects } = useEdgeInteraction();
  const { getViewport } = useReactFlow();
  const isHovered = hoveredEdgeId === id;
  const isSelected = selectedEdgeId === id;

  const userOffset: EdgeOffset = edgeOffsets[id] ?? { x: 0, y: 0 };
  const offsetX = userOffset.x;
  const offsetY = (data.parallelOffset ?? 0) + userOffset.y;

  // Obstacles = all system nodes except the source and target of this edge
  const obstacles = useMemo(
    () => nodeRects.filter((r) => r.id !== source && r.id !== target),
    [nodeRects, source, target],
  );

  const [edgePath, labelX, labelY] = useMemo(
    () => buildStepPath(sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, offsetX, offsetY, obstacles),
    [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, offsetX, offsetY, obstacles],
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
