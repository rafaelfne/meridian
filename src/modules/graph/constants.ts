/**
 * Shared constants for graph dependency types, colors, and labels.
 * Used by both the server-side graph builder and client-side toolbar/legend.
 */

import type { LayerName } from "./types";

export const DEPENDENCY_TYPES = [
  "HTTP_API",
  "KAFKA_TOPIC",
  "RABBITMQ_QUEUE",
  "SQS_QUEUE",
  "SHARED_DATABASE",
  "CROSS_DATABASE_QUERY",
  "SHARED_PACKAGE",
  "GRPC",
  "FILE_DEPENDENCY",
] as const;

export type DependencyTypeName = (typeof DEPENDENCY_TYPES)[number];

export interface DependencyTypeConfig {
  label: string;
  color: string;
  animated: boolean;
}

/** Style and metadata for each dependency type. */
export const DEPENDENCY_TYPE_CONFIG: Record<
  DependencyTypeName,
  DependencyTypeConfig
> = {
  HTTP_API: { label: "HTTP API", color: "#4f46e5", animated: false },
  KAFKA_TOPIC: { label: "Kafka Topic", color: "#059669", animated: true },
  RABBITMQ_QUEUE: { label: "RabbitMQ Queue", color: "#A855F7", animated: true },
  SQS_QUEUE: { label: "SQS Queue", color: "#EAB308", animated: true },
  SHARED_DATABASE: {
    label: "Shared Database",
    color: "#d97706",
    animated: false,
  },
  CROSS_DATABASE_QUERY: {
    label: "Cross-DB Query",
    color: "#dc2626",
    animated: false,
  },
  SHARED_PACKAGE: {
    label: "Shared Package",
    color: "#7c3aed",
    animated: false,
  },
  GRPC: { label: "gRPC", color: "#0891b2", animated: false },
  FILE_DEPENDENCY: {
    label: "File Dependency",
    color: "#6b7280",
    animated: false,
  },
};

export const DEFAULT_EDGE_STYLE = { color: "#94a3b8", animated: false };

/* ── Topological Layer Configuration ──────────────────── */

export interface LayerConfig {
  label: string;
  color: string;
}

export const LAYER_CONFIG: Record<LayerName, LayerConfig> = {
  EDGE: { label: "Edge / Ingress", color: "#0891b2" },
  BUSINESS_LOGIC: { label: "Business Logic", color: "#4f46e5" },
  DATA_INFRA: { label: "Data / Infrastructure", color: "#d97706" },
};

export const COLLAPSE_ZOOM_THRESHOLD = 0.4;
export const EXPAND_ZOOM_THRESHOLD = 0.5;
