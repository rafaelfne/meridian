"use client";

import { useRef } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
} from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import type { GraphEdgeData } from "@/modules/graph/types";
import { EdgeParticles } from "./EdgeParticles";
import { useGraphHover } from "./GraphHoverContext";
import type { EdgeOffset } from "./GraphHoverContext";
import edgeStyles from "./DependencyEdge.module.css";

type DependencyEdgeProps = EdgeProps & { data: GraphEdgeData };

/**
 * Builds an orthogonal (step-style) SVG path with rounded corners.
 * offsetX shifts the two bend columns, offsetY shifts the middle row.
 * Arrow tips stay anchored to node handles.
 *
 *  source ─╮         ╭─ target
 *           │ offsetY │
 *           ╰─────────╯
 *          ← offsetX →
 */
function buildStepPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  offsetX = 0,
  offsetY = 0,
  borderRadius = 0,
): [path: string, labelX: number, labelY: number] {
  const dx = targetX - sourceX;
  const qX1 = sourceX + dx / 3 + offsetX;
  const qX2 = sourceX + (dx * 2) / 3 + offsetX;
  const midY = (sourceY + targetY) / 2 + offsetY;

  const dy1 = midY - sourceY;
  const dy2 = targetY - midY;
  const sgnY1 = Math.sign(dy1) || 1;
  const sgnY2 = Math.sign(dy2) || 1;

  const r = Math.max(
    0,
    Math.min(borderRadius, Math.abs(dy1) / 2, Math.abs(dy2) / 2, Math.abs(dx) / 6),
  );

  let path: string;

  if (r < 0.5) {
    path = [
      `M ${sourceX},${sourceY}`,
      `L ${qX1},${sourceY}`,
      `L ${qX1},${midY}`,
      `L ${qX2},${midY}`,
      `L ${qX2},${targetY}`,
      `L ${targetX},${targetY}`,
    ].join(" ");
  } else {
    path = [
      `M ${sourceX},${sourceY}`,
      `L ${qX1 - r},${sourceY}`,
      `Q ${qX1},${sourceY} ${qX1},${sourceY + sgnY1 * r}`,
      `L ${qX1},${midY - sgnY1 * r}`,
      `Q ${qX1},${midY} ${qX1 + r},${midY}`,
      `L ${qX2 - r},${midY}`,
      `Q ${qX2},${midY} ${qX2},${midY + sgnY2 * r}`,
      `L ${qX2},${targetY - sgnY2 * r}`,
      `Q ${qX2},${targetY} ${qX2 + r},${targetY}`,
      `L ${targetX},${targetY}`,
    ].join(" ");
  }

  return [path, (qX1 + qX2) / 2, midY];
}

export function DependencyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
  data,
}: DependencyEdgeProps) {
  const { hoveredEdgeId, edgeOffsets, setEdgeOffset } = useGraphHover();
  const { getViewport } = useReactFlow();
  const isHovered = hoveredEdgeId === id;

  const userOffset: EdgeOffset = edgeOffsets[id] ?? { x: 0, y: 0 };
  const offsetX = userOffset.x;
  const offsetY = (data.parallelOffset ?? 0) + userOffset.y;

  const [edgePath, labelX, labelY] = buildStepPath(
    sourceX, sourceY, targetX, targetY, offsetX, offsetY,
  );

  const strokeColor = (style?.stroke as string) ?? "#94a3b8";
  const baseWidth = (style?.strokeWidth as number) ?? 2;

  // Drag state
  const dragRef = useRef<{ startX: number; startY: number; startOffset: EdgeOffset } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<SVGElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffset: userOffset };
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
  };

  const midX = labelX;
  const midY = labelY;

  return (
    <>
      {isHovered && (
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
          strokeWidth: isHovered ? baseWidth + 1 : baseWidth,
          transition: "stroke-width 0.15s ease",
        }}
      />
      {/* Wide transparent hit area over the full edge path for dragging */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        style={{ cursor: dragRef.current ? "grabbing" : "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="nodrag nopan"
      />
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
            color: strokeColor,
            backgroundColor: "color-mix(in srgb, var(--card) 85%, transparent)",
            padding: "2px 6px",
            borderRadius: 4,
            opacity: style?.opacity != null ? Number(style.opacity) : 1,
            transition: "opacity 0.2s ease",
          }}
          className="nodrag nopan"
        >
          {data.label}
        </div>
        {/* "depends on" label near source tip */}
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${sourceX + 48}px,${sourceY - 10}px)`,
            pointerEvents: "none",
            fontSize: "0.5rem",
            fontWeight: 600,
            color: strokeColor,
            backgroundColor: "color-mix(in srgb, var(--card) 90%, transparent)",
            padding: "1px 4px",
            borderRadius: 3,
            opacity: (style?.opacity != null ? Number(style.opacity) : 1) * (isHovered ? 1 : 0.45),
            transition: "opacity 0.2s ease",
            letterSpacing: "0.03em",
            whiteSpace: "nowrap",
          }}
          className="nodrag nopan"
        >
          depends on
        </div>
        {/* "consumed by" label near target tip (arrowhead) */}
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${targetX - 48}px,${targetY - 10}px)`,
            pointerEvents: "none",
            fontSize: "0.5rem",
            fontWeight: 600,
            color: strokeColor,
            backgroundColor: "color-mix(in srgb, var(--card) 90%, transparent)",
            padding: "1px 4px",
            borderRadius: 3,
            opacity: (style?.opacity != null ? Number(style.opacity) : 1) * (isHovered ? 1 : 0.45),
            transition: "opacity 0.2s ease",
            letterSpacing: "0.03em",
            whiteSpace: "nowrap",
          }}
          className="nodrag nopan"
        >
          consumed by
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
