"use client";

import { useRef } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
} from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import type { GraphEdgeData } from "@/modules/graph/types";
import { EdgeParticles } from "./EdgeParticles";
import { useGraphHover } from "./GraphHoverContext";
import edgeStyles from "./DependencyEdge.module.css";

type DependencyEdgeProps = EdgeProps & { data: GraphEdgeData };

/**
 * Builds an orthogonal (step-style) SVG path that starts at (sourceX, sourceY)
 * and ends at (targetX, targetY) while routing the horizontal middle section
 * through an offset Y level.  Keeps arrow endpoints anchored to handles.
 *
 * Shape (LR):  source ─┐         ┌─ target
 *                       │ offset  │
 *                       └─────────┘
 */
function buildOffsetStepPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  offset: number,
  borderRadius = 5,
): [path: string, labelX: number, labelY: number] {
  const dx = targetX - sourceX;
  const qX1 = sourceX + dx / 3;
  const qX2 = sourceX + (dx * 2) / 3;
  const offsetY = (sourceY + targetY) / 2 + offset;

  const dy1 = offsetY - sourceY;
  const dy2 = targetY - offsetY;
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
      `L ${qX1},${offsetY}`,
      `L ${qX2},${offsetY}`,
      `L ${qX2},${targetY}`,
      `L ${targetX},${targetY}`,
    ].join(" ");
  } else {
    path = [
      `M ${sourceX},${sourceY}`,
      `L ${qX1 - r},${sourceY}`,
      `Q ${qX1},${sourceY} ${qX1},${sourceY + sgnY1 * r}`,
      `L ${qX1},${offsetY - sgnY1 * r}`,
      `Q ${qX1},${offsetY} ${qX1 + r},${offsetY}`,
      `L ${qX2 - r},${offsetY}`,
      `Q ${qX2},${offsetY} ${qX2},${offsetY + sgnY2 * r}`,
      `L ${qX2},${targetY - sgnY2 * r}`,
      `Q ${qX2},${targetY} ${qX2 + r},${targetY}`,
      `L ${targetX},${targetY}`,
    ].join(" ");
  }

  return [path, (sourceX + targetX) / 2, offsetY];
}

export function DependencyEdge({
  id,
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
  const { hoveredEdgeId, edgeOffsets, setEdgeOffset } = useGraphHover();
  const { getViewport } = useReactFlow();
  const isHovered = hoveredEdgeId === id;

  // Combine auto parallel offset with user-dragged offset
  const userOffset = edgeOffsets[id] ?? 0;
  const offset = (data.parallelOffset ?? 0) + userOffset;

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (Math.abs(offset) < 0.5) {
    // No offset — standard smooth step, endpoints at handles
    const [path, lx, ly] = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });
    edgePath = path;
    labelX = lx;
    labelY = ly;
  } else {
    // Parallel / dragged edges — orthogonal step path that starts and ends at the
    // actual handle positions but routes through an offset Y level in the middle.
    // This keeps arrow tips connected to the nodes while separating parallel edges.
    [edgePath, labelX, labelY] = buildOffsetStepPath(
      sourceX, sourceY, targetX, targetY, offset,
    );
  }

  const strokeColor = (style?.stroke as string) ?? "#94a3b8";
  const baseWidth = (style?.strokeWidth as number) ?? 2;

  // Drag handle state
  const dragRef = useRef<{ startY: number; startOffset: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<SVGCircleElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startOffset: userOffset };
  };

  const handlePointerMove = (e: React.PointerEvent<SVGCircleElement>) => {
    if (!dragRef.current) return;
    const { zoom } = getViewport();
    const dy = (e.clientY - dragRef.current.startY) / zoom;
    setEdgeOffset(id, dragRef.current.startOffset + dy);
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  // Midpoint in graph coordinates (label position)
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
      {/* Drag handle — invisible circle at midpoint, shows on hover */}
      <circle
        cx={midX}
        cy={midY}
        r={6}
        fill={strokeColor}
        fillOpacity={isHovered || userOffset !== 0 ? 0.7 : 0}
        stroke="none"
        style={{ cursor: "ns-resize" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="nodrag nopan"
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
      </EdgeLabelRenderer>
    </>
  );
}

