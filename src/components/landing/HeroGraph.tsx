"use client";

import { useEffect, useRef } from "react";
import styles from "./HeroGraph.module.css";

const nodes = [
  { id: 1, cx: 15, cy: 25 },
  { id: 2, cx: 30, cy: 15 },
  { id: 3, cx: 50, cy: 10 },
  { id: 4, cx: 70, cy: 20 },
  { id: 5, cx: 85, cy: 30 },
  { id: 6, cx: 25, cy: 50 },
  { id: 7, cx: 45, cy: 45 },
  { id: 8, cx: 65, cy: 55 },
  { id: 9, cx: 80, cy: 60 },
  { id: 10, cx: 35, cy: 75 },
  { id: 11, cx: 55, cy: 80 },
  { id: 12, cx: 75, cy: 78 },
];

const edges = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 4, to: 5 },
  { from: 1, to: 6 },
  { from: 6, to: 7 },
  { from: 7, to: 8 },
  { from: 8, to: 9 },
  { from: 7, to: 3 },
  { from: 10, to: 11 },
  { from: 11, to: 12 },
  { from: 6, to: 10 },
];

function getNode(id: number) {
  return nodes.find((n) => n.id === id);
}

export function HeroGraph() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const visibleClass = styles.visible;
    if (svg && visibleClass) {
      svg.classList.add(visibleClass);
    }
  }, []);

  return (
    <div className={styles.container}>
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {edges.map((edge, i) => {
          const from = getNode(edge.from);
          const to = getNode(edge.to);
          if (!from || !to) return null;
          const mx = (from.cx + to.cx) / 2;
          const my = (from.cy + to.cy) / 2 - 5;
          return (
            <path
              key={`edge-${i}`}
              className={styles.edge}
              d={`M ${from.cx} ${from.cy} Q ${mx} ${my} ${to.cx} ${to.cy}`}
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          );
        })}
        {nodes.map((node) => (
          <circle
            key={`node-${node.id}`}
            className={styles.node}
            cx={node.cx}
            cy={node.cy}
            r="0.8"
            style={{ animationDelay: `${node.id * 0.2}s` }}
          />
        ))}
      </svg>
    </div>
  );
}
