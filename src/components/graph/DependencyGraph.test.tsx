/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DependencyGraph } from "./DependencyGraph";
import type { GraphData } from "@/modules/graph/types";

vi.mock("@xyflow/react", () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow">{children}</div>
  ),
  MiniMap: () => <div data-testid="minimap" />,
  Controls: () => <div data-testid="controls" />,
  Background: () => <div data-testid="background" />,
  BackgroundVariant: { Dots: "dots" },
  useNodesState: (initial: unknown[]) => [initial, vi.fn(), vi.fn()],
  useEdgesState: (initial: unknown[]) => [initial, vi.fn(), vi.fn()],
  useReactFlow: () => ({ getNodes: () => [] }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

function createGraphData(overrides: Partial<GraphData> = {}): GraphData {
  return {
    nodes: [
      {
        id: "node-1",
        type: "system",
        position: { x: 0, y: 0 },
        data: {
          label: "Auth Service",
          slug: "auth-service",
          domain: "Identity",
          language: "TypeScript",
          framework: "NestJS",
          servicesCount: 3,
          risksCount: 0,
          domainColor: "#4f46e5",
        },
      },
    ],
    edges: [],
    ...overrides,
  };
}

describe("DependencyGraph", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders empty state when no nodes", () => {
    render(<DependencyGraph data={createGraphData({ nodes: [], edges: [] })} />);
    expect(screen.getByText("No systems to display.")).toBeInTheDocument();
    expect(
      screen.getByText("Upload an inventory to see the dependency graph."),
    ).toBeInTheDocument();
  });

  it("renders ReactFlow when nodes exist", () => {
    render(<DependencyGraph data={createGraphData()} />);
    expect(screen.getByTestId("react-flow")).toBeInTheDocument();
  });

  it("renders MiniMap", () => {
    render(<DependencyGraph data={createGraphData()} />);
    expect(screen.getByTestId("minimap")).toBeInTheDocument();
  });

  it("renders Controls", () => {
    render(<DependencyGraph data={createGraphData()} />);
    expect(screen.getByTestId("controls")).toBeInTheDocument();
  });

  it("renders Background", () => {
    render(<DependencyGraph data={createGraphData()} />);
    expect(screen.getByTestId("background")).toBeInTheDocument();
  });
});
