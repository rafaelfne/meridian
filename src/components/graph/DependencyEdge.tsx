"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
} from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import type { GraphEdgeData } from "@/modules/graph/types";
import { EdgeParticles } from "./EdgeParticles";
import { useGraphHover } from "./GraphHoverContext";
import edgeStyles from "./DependencyEdge.module.css";

type DependencyEdgeProps = EdgeProps & { data: GraphEdgeData };

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
  const { hoveredEdgeId } = useGraphHover();
  const isHovered = hoveredEdgeId === id;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const strokeColor = (style?.stroke as string) ?? "#94a3b8";
  const baseWidth = (style?.strokeWidth as number) ?? 2;

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
          }}
          className="nodrag nopan"
        >
          {data.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
