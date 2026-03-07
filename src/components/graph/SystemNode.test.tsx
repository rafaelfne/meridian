/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SystemNode } from "./SystemNode";
import type { GraphNodeData } from "@/modules/graph/types";

vi.mock("@xyflow/react", () => ({
  Handle: ({ type, id }: { type: string; id?: string }) => (
    <div data-testid={id ? `handle-${id}` : `handle-${type}`} />
  ),
  Position: { Left: "left", Right: "right", Top: "top", Bottom: "bottom" },
}));

function createNodeProps(overrides: Partial<GraphNodeData> = {}) {
  const data: GraphNodeData = {
    label: "Auth Service",
    slug: "auth-service",
    domain: "Identity",
    language: "TypeScript",
    framework: "NestJS",
    servicesCount: 3,
    risksCount: 0,
    domainColor: "#4f46e5",
    ...overrides,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- React Flow NodeProps requires internal fields we don't need in tests
  return { id: "node-1", data, type: "system", selected: false } as any;
}

describe("SystemNode", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders system name", () => {
    render(<SystemNode {...createNodeProps()} />);
    expect(screen.getByText("Auth Service")).toBeInTheDocument();
  });

  it("renders domain badge", () => {
    render(<SystemNode {...createNodeProps()} />);
    expect(screen.getByText("Identity")).toBeInTheDocument();
  });

  it("renders language when provided", () => {
    render(<SystemNode {...createNodeProps({ language: "TypeScript" })} />);
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("does not render language when null", () => {
    render(<SystemNode {...createNodeProps({ language: null })} />);
    expect(screen.queryByText("TypeScript")).not.toBeInTheDocument();
  });

  it("renders risk indicator when risksCount > 0", () => {
    render(<SystemNode {...createNodeProps({ risksCount: 2 })} />);
    expect(screen.getByTitle("2 risk(s)")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("does not render risk indicator when risksCount is 0", () => {
    render(<SystemNode {...createNodeProps({ risksCount: 0 })} />);
    expect(screen.queryByTitle(/risk/)).not.toBeInTheDocument();
  });

  it("renders source and target handles on all 4 sides", () => {
    render(<SystemNode {...createNodeProps()} />);
    // 4 target handles (top, right, bottom, left)
    expect(screen.getByTestId("handle-target-top")).toBeInTheDocument();
    expect(screen.getByTestId("handle-target-right")).toBeInTheDocument();
    expect(screen.getByTestId("handle-target-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("handle-target-left")).toBeInTheDocument();
    // 4 source handles (top, right, bottom, left)
    expect(screen.getByTestId("handle-source-top")).toBeInTheDocument();
    expect(screen.getByTestId("handle-source-right")).toBeInTheDocument();
    expect(screen.getByTestId("handle-source-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("handle-source-left")).toBeInTheDocument();
  });

  it("applies domain color as inline style on badge", () => {
    render(<SystemNode {...createNodeProps({ domainColor: "#4f46e5" })} />);
    const badge = screen.getByText("Identity");
    expect(badge).toHaveStyle({ backgroundColor: "#4f46e5" });
  });
});
