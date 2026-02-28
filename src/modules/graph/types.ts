/** Lightweight record types used by graph resolver functions (no Prisma imports). */

export interface DatabaseRecord {
  name: string;
  provider: string;
  systemId: string;
}

export interface IntegrationRecord {
  name: string;
  type: string;
  targetSystem: string | null;
  systemId: string;
}

export interface PackageRecord {
  name: string;
  scope: "INTERNAL" | "OPEN_SOURCE" | "TEST";
  systemId: string;
}

export interface DependencyResult {
  sourceId: string;
  targetId: string;
  type: "SHARED_DATABASE" | "CROSS_DATABASE_QUERY" | "SHARED_PACKAGE";
  label?: string;
}

export interface MessageTopicWithSystem {
  name: string;
  role: "PRODUCER" | "CONSUMER" | "BOTH";
  broker: "KAFKA" | "RABBITMQ" | "SQS" | "SNS" | "OTHER";
  systemId: string;
}

export interface ResolvedDependency {
  sourceId: string;
  targetId: string;
  type: "KAFKA_TOPIC" | "RABBITMQ_QUEUE" | "SQS_QUEUE";
  label: string;
}

export interface Integration {
  id: string;
  name: string;
  type: string;
  targetSystem: string | null;
  url: string | null;
  protocol: string | null;
  systemId: string;
}

export interface System {
  id: string;
  slug: string;
  name: string;
}

export interface Dependency {
  sourceId: string;
  targetId: string;
  type: "HTTP_API";
  label: string | null;
  metadata: Record<string, unknown> | null;
}

export interface UnresolvedIntegration {
  integrationId: string;
  integrationName: string;
  sourceSystemId: string;
  targetSystemSlug: string | null;
  reason: string;
}

export interface ResolveHttpDepsResult {
  resolved: Dependency[];
  unresolved: UnresolvedIntegration[];
}

// ── React Flow Graph Types ─────────────────────────────

/** Data payload for a system node rendered in React Flow. */
export interface GraphNodeData extends Record<string, unknown> {
  label: string;
  domain: string;
  language: string | null;
  framework: string | null;
  servicesCount: number;
  risksCount: number;
  domainColor: string;
}

/** Data payload for a dependency edge rendered in React Flow. */
export interface GraphEdgeData extends Record<string, unknown> {
  type: string;
  label: string;
}

/** A React Flow node representing a system. */
export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: GraphNodeData;
}

/** A React Flow edge representing a dependency. */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated: boolean;
  style: { stroke: string; strokeWidth: number };
  data: GraphEdgeData;
}

/** The full graph data response for the API. */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Raw system data as received from the data source (e.g., Prisma query). */
export interface SystemWithCounts {
  id: string;
  name: string;
  slug: string;
  language: string | null;
  framework: string | null;
  domain: { name: string };
  _count: { services: number; risks: number };
}

/** Raw dependency data as received from the data source. */
export interface DependencyRecord {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  label: string | null;
}
