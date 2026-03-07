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

/** Supported layer names for topological layout. */
export type LayerName = "EDGE" | "BUSINESS_LOGIC" | "DATA_INFRA";

/** Lightweight service info attached to graph nodes. */
export interface GraphServiceInfo {
  slug: string;
  name: string;
  type: string;
  datadogStatus?: string | null;
}

/** Data payload for a system node rendered in React Flow. */
export interface GraphNodeData extends Record<string, unknown> {
  label: string;
  slug: string;
  domain: string;
  language: string | null;
  framework: string | null;
  servicesCount: number;
  risksCount: number;
  domainColor: string;
  layer?: LayerName;
  /** Services belonging to this system (for sub-service port rendering). */
  services?: GraphServiceInfo[];
  /** Derived Datadog status for the system (worst of its services, excluding NOT_FOUND). */
  datadogStatus?: string | null;
  /** Timestamp of the most recent service poll. */
  datadogStatusUpdatedAt?: string | null;
  /** All services with their individual Datadog statuses (for tooltip breakdown). */
  datadogServices?: { name: string; slug: string; status: string }[];
}

/** Data payload for a dependency edge rendered in React Flow. */
export interface GraphEdgeData extends Record<string, unknown> {
  type: string;
  label: string;
  showParticles?: boolean;
  particleSpeed?: number;
  particleCount?: number;
  /** Vertical offset (px) to separate parallel edges sharing the same node pair. */
  parallelOffset?: number;
  /** When the dependency targets a specific service inside a monolith. */
  targetServiceSlug?: string;
  /** True when edge is connected to a highlighted node — renders solid (no dash). */
  solid?: boolean;
  /** True when edge is dimmed (not connected to highlighted node) — disables interaction. */
  dimmed?: boolean;
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
  sourceHandle?: string;
  targetHandle?: string;
  type: string;
  animated: boolean;
  style: { stroke: string; strokeWidth: number };
  markerEnd?: {
    type: "arrow" | "arrowclosed";
    color?: string;
    width?: number;
    height?: number;
  };
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
  layer?: LayerName | null;
  domain: { name: string };
  datadogStatus?: string | null;
  _count: { services: number; risks: number };
  services?: { slug: string; name: string; type: string; datadogStatus?: string | null; datadogStatusUpdatedAt?: Date | null }[];
}

/** Raw dependency data as received from the data source. */
export interface DependencyRecord {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  label: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}
