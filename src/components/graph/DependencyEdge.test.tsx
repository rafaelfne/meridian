/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DependencyEdge } from "./DependencyEdge";

vi.mock("@xyflow/react", () => ({
  BaseEdge: ({ id }: { id: string }) => <path data-testid={`edge-${id}`} />,
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="edge-label-renderer">{children}</div>
  ),
  getSmoothStepPath: () => ["M0,0 L100,100", 50, 50],
  Position: { Left: "left", Right: "right", Top: "top", Bottom: "bottom" },
}));

function createEdgeProps(overrides = {}) {
  return {
    id: "edge-1",
    source: "node-1",
    target: "node-2",
    sourceX: 0,
    sourceY: 0,
    targetX: 100,
    targetY: 100,
    sourcePosition: "right",
    targetPosition: "left",
    style: { stroke: "#4f46e5", strokeWidth: 2 },
    data: { type: "HTTP_API", label: "http api" },
    ...overrides,
  } as any;
}

describe("DependencyEdge", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders edge path", () => {
    render(<DependencyEdge {...createEdgeProps()} />);
    expect(screen.getByTestId("edge-edge-1")).toBeInTheDocument();
  });

  it("renders edge label", () => {
    render(<DependencyEdge {...createEdgeProps()} />);
    expect(screen.getByText("http api")).toBeInTheDocument();
  });

  it("renders edge label with correct color", () => {
    render(<DependencyEdge {...createEdgeProps()} />);
    const label = screen.getByText("http api");
    expect(label).toHaveStyle({ color: "#4f46e5" });
  });
});
