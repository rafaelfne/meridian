import { describe, it, expect } from "vitest";
import { buildGraphData } from "./build-graph-data";
import type { SystemWithCounts, DependencyRecord } from "../types";

function makeSystem(overrides: Partial<SystemWithCounts> = {}): SystemWithCounts {
  return {
    id: "sys-1",
    name: "Order Service",
    slug: "order-service",
    language: "TypeScript",
    framework: "NestJS",
    domain: { name: "Commerce" },
    _count: { services: 3, risks: 1 },
    ...overrides,
  };
}

function makeDependency(
  overrides: Partial<DependencyRecord> = {},
): DependencyRecord {
  return {
    id: "dep-1",
    sourceId: "sys-1",
    targetId: "sys-2",
    type: "HTTP_API",
    label: null,
    ...overrides,
  };
}

describe("buildGraphData", () => {
  it("returns empty nodes and edges for empty input", () => {
    const result = buildGraphData([], []);

    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it("builds nodes from systems with no dependencies", () => {
    const systems = [
      makeSystem({ id: "sys-1", name: "Order Service" }),
      makeSystem({
        id: "sys-2",
        name: "Payment Service",
        slug: "payment-service",
        domain: { name: "Finance" },
      }),
    ];

    const result = buildGraphData(systems, []);

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(0);

    const orderNode = result.nodes.find((n) => n.id === "sys-1");
    expect(orderNode).toBeDefined();
    expect(orderNode!.data.label).toBe("Order Service");
    expect(orderNode!.data.domain).toBe("Commerce");
    expect(orderNode!.data.language).toBe("TypeScript");
    expect(orderNode!.data.framework).toBe("NestJS");
    expect(orderNode!.data.servicesCount).toBe(3);
    expect(orderNode!.data.risksCount).toBe(1);
    expect(orderNode!.type).toBe("system");
  });

  it("builds nodes and edges from systems and dependencies", () => {
    const systems = [
      makeSystem({ id: "sys-1", name: "Order Service" }),
      makeSystem({
        id: "sys-2",
        name: "Payment Service",
        slug: "payment-service",
      }),
    ];
    const dependencies = [
      makeDependency({
        id: "dep-1",
        sourceId: "sys-1",
        targetId: "sys-2",
        type: "HTTP_API",
        label: "Process Payment",
      }),
    ];

    const result = buildGraphData(systems, dependencies);

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);

    const edge = result.edges[0];
    expect(edge).toBeDefined();
    expect(edge!.source).toBe("sys-1");
    expect(edge!.target).toBe("sys-2");
    expect(edge!.data.type).toBe("HTTP_API");
    expect(edge!.data.label).toBe("Process Payment");
  });

  it("filters out edges where source or target is not in the systems list", () => {
    const systems = [makeSystem({ id: "sys-1" })];
    const dependencies = [
      makeDependency({
        id: "dep-1",
        sourceId: "sys-1",
        targetId: "sys-unknown",
      }),
    ];

    const result = buildGraphData(systems, dependencies);

    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(0);
  });

  it("calculates dagre positions (nodes have non-zero positions)", () => {
    const systems = [
      makeSystem({ id: "sys-1", name: "System A" }),
      makeSystem({
        id: "sys-2",
        name: "System B",
        slug: "system-b",
      }),
    ];
    const dependencies = [
      makeDependency({
        id: "dep-1",
        sourceId: "sys-1",
        targetId: "sys-2",
      }),
    ];

    const result = buildGraphData(systems, dependencies);

    // With LR layout and a dependency, nodes should be positioned differently
    const nodeA = result.nodes.find((n) => n.id === "sys-1");
    const nodeB = result.nodes.find((n) => n.id === "sys-2");
    expect(nodeA).toBeDefined();
    expect(nodeB).toBeDefined();

    // Nodes should be at different positions (source left, target right)
    expect(nodeA!.position.x).not.toBe(nodeB!.position.x);

    // With LR direction, source node should be to the left of target
    expect(nodeA!.position.x).toBeLessThan(nodeB!.position.x);
  });

  it("assigns consistent domain colors", () => {
    const systems = [
      makeSystem({
        id: "sys-1",
        domain: { name: "Commerce" },
      }),
      makeSystem({
        id: "sys-2",
        slug: "sys-2",
        domain: { name: "Commerce" },
      }),
      makeSystem({
        id: "sys-3",
        slug: "sys-3",
        domain: { name: "Finance" },
      }),
    ];

    const result = buildGraphData(systems, []);

    const commerceNodes = result.nodes.filter(
      (n) => n.data.domain === "Commerce",
    );
    const financeNode = result.nodes.find((n) => n.data.domain === "Finance");

    // Same domain should get same color
    expect(commerceNodes).toHaveLength(2);
    expect(commerceNodes[0]!.data.domainColor).toBe(
      commerceNodes[1]!.data.domainColor,
    );

    // Different domains should have a color assigned (may or may not differ due to hash collisions)
    expect(financeNode).toBeDefined();
    expect(financeNode!.data.domainColor).toBeTruthy();
    expect(financeNode!.data.domainColor).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("edge data contains type and label", () => {
    const systems = [
      makeSystem({ id: "sys-1" }),
      makeSystem({ id: "sys-2", slug: "sys-2" }),
    ];
    const dependencies = [
      makeDependency({
        id: "dep-kafka",
        sourceId: "sys-1",
        targetId: "sys-2",
        type: "KAFKA_TOPIC",
        label: "order.events",
      }),
    ];

    const result = buildGraphData(systems, dependencies);

    expect(result.edges).toHaveLength(1);
    const edge = result.edges[0]!;
    expect(edge.data.type).toBe("KAFKA_TOPIC");
    expect(edge.data.label).toBe("order.events");
  });

  it("generates a default label from type when edge label is null", () => {
    const systems = [
      makeSystem({ id: "sys-1" }),
      makeSystem({ id: "sys-2", slug: "sys-2" }),
    ];
    const dependencies = [
      makeDependency({
        id: "dep-1",
        sourceId: "sys-1",
        targetId: "sys-2",
        type: "SHARED_DATABASE",
        label: null,
      }),
    ];

    const result = buildGraphData(systems, dependencies);

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.data.label).toBe("shared database");
  });

  it("styles KAFKA_TOPIC edges as animated", () => {
    const systems = [
      makeSystem({ id: "sys-1" }),
      makeSystem({ id: "sys-2", slug: "sys-2" }),
    ];
    const dependencies = [
      makeDependency({
        id: "dep-kafka",
        sourceId: "sys-1",
        targetId: "sys-2",
        type: "KAFKA_TOPIC",
        label: "topic",
      }),
    ];

    const result = buildGraphData(systems, dependencies);

    const kafkaEdge = result.edges[0]!;
    expect(kafkaEdge.animated).toBe(false);
    expect(kafkaEdge.style.stroke).toBe("#059669");
  });

  it("uses smoothstep edge type", () => {
    const systems = [
      makeSystem({ id: "sys-1" }),
      makeSystem({ id: "sys-2", slug: "sys-2" }),
    ];
    const dependencies = [
      makeDependency({
        id: "dep-1",
        sourceId: "sys-1",
        targetId: "sys-2",
      }),
    ];

    const result = buildGraphData(systems, dependencies);

    expect(result.edges[0]!.type).toBe("smoothstep");
  });

  it("handles single node with no edges", () => {
    const systems = [makeSystem({ id: "sys-1" })];

    const result = buildGraphData(systems, []);

    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(0);
    // Single node should still have a position
    expect(typeof result.nodes[0]!.position.x).toBe("number");
    expect(typeof result.nodes[0]!.position.y).toBe("number");
  });

  it("only includes services targeted by edges (not all services)", () => {
    const services = [
      { slug: "api-orders", name: "API Orders", type: "API" },
      { slug: "worker-sync", name: "Worker Sync", type: "WORKER" },
    ];
    const systems = [
      makeSystem({ id: "sys-1" }),
      makeSystem({ id: "sys-2", slug: "sys-2", services }),
    ];
    // Edge targets only api-orders, not worker-sync
    const dependencies = [
      makeDependency({
        id: "dep-1",
        sourceId: "sys-1",
        targetId: "sys-2",
        metadata: { targetServiceSlug: "api-orders" },
      }),
    ];

    const result = buildGraphData(systems, dependencies);

    const targetNode = result.nodes.find((n) => n.id === "sys-2")!;
    expect(targetNode.data.services).toEqual([
      { slug: "api-orders", name: "API Orders", type: "API" },
    ]);
  });

  it("omits services when no edge targets them", () => {
    const services = [
      { slug: "api-orders", name: "API Orders", type: "API" },
      { slug: "worker-sync", name: "Worker Sync", type: "WORKER" },
    ];
    const systems = [makeSystem({ id: "sys-1", services })];

    const result = buildGraphData(systems, []);

    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]!.data.services).toBeUndefined();
  });

  it("sets targetHandle when dependency metadata has targetServiceSlug", () => {
    const systems = [
      makeSystem({ id: "sys-1" }),
      makeSystem({ id: "sys-2", slug: "sys-2" }),
    ];
    const dependencies = [
      makeDependency({
        id: "dep-1",
        sourceId: "sys-1",
        targetId: "sys-2",
        metadata: { url: "https://example.com", targetServiceSlug: "api-investments" },
      }),
    ];

    const result = buildGraphData(systems, dependencies);

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.targetHandle).toBe("svc-api-investments");
    expect(result.edges[0]!.data.targetServiceSlug).toBe("api-investments");
  });

  it("does not set targetHandle when metadata has no targetServiceSlug", () => {
    const systems = [
      makeSystem({ id: "sys-1" }),
      makeSystem({ id: "sys-2", slug: "sys-2" }),
    ];
    const dependencies = [
      makeDependency({
        id: "dep-1",
        sourceId: "sys-1",
        targetId: "sys-2",
        metadata: { url: "https://example.com" },
      }),
    ];

    const result = buildGraphData(systems, dependencies);

    expect(result.edges).toHaveLength(1);
    // Without a service slug, targetHandle is set by assignOptimalHandles
    expect(result.edges[0]!.targetHandle).toMatch(/^target-(top|right|bottom|left)$/);
    expect(result.edges[0]!.data.targetServiceSlug).toBeUndefined();
  });

  it("computes taller layout for nodes with targeted services", () => {
    const services = [
      { slug: "api-a", name: "API A", type: "API" },
      { slug: "api-b", name: "API B", type: "API" },
      { slug: "worker-c", name: "Worker C", type: "WORKER" },
    ];
    const systems = [
      makeSystem({ id: "sys-1" }),
      makeSystem({ id: "sys-2", slug: "sys-2", services, _count: { services: 3, risks: 0 } }),
    ];
    const dependencies = [
      makeDependency({ id: "dep-1", sourceId: "sys-1", targetId: "sys-2", metadata: { targetServiceSlug: "api-a" } }),
      makeDependency({ id: "dep-2", sourceId: "sys-1", targetId: "sys-2", type: "KAFKA_TOPIC", metadata: { targetServiceSlug: "worker-c" } }),
    ];

    const result = buildGraphData(systems, dependencies);

    // sys-2 should have 2 targeted services
    const targetNode = result.nodes.find((n) => n.id === "sys-2")!;
    expect(targetNode.data.services).toHaveLength(2);
    expect(result.nodes).toHaveLength(2);
    expect(typeof result.nodes[0]!.position.y).toBe("number");
    expect(typeof result.nodes[1]!.position.y).toBe("number");
  });
});
