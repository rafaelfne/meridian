"use client";

interface EdgeParticlesProps {
  edgePath: string;
  color?: string;
  count?: number;
  duration?: number;
}

export function EdgeParticles({
  edgePath,
  color = "#94a3b8",
  count = 2,
  duration = 3,
}: EdgeParticlesProps) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const delay = (duration / count) * i;
        return (
          <circle key={i} r={3} fill={color} opacity={0.85}>
            <animateMotion
              dur={`${duration}s`}
              repeatCount="indefinite"
              begin={`${delay}s`}
              path={edgePath}
            />
          </circle>
        );
      })}
    </g>
  );
}
