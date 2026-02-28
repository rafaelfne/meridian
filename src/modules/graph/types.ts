export interface IntegrationData {
  systemId: string;
  targetSystem: string | null;
  type: string;
}

export interface KafkaTopicData {
  systemId: string;
  name: string;
  role: string;
}

export interface DatabaseData {
  systemId: string;
  name: string;
  provider: string;
}

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

export interface KafkaTopicWithSystem {
  name: string;
  role: "PRODUCER" | "CONSUMER" | "BOTH";
  systemId: string;
  type: "KAFKA_TOPIC";
  label: string;
}

export interface ResolvedDependency {
  sourceId: string;
  targetId: string;
  type: string;
  label?: string;
}

export interface ProcessDependenciesResult {
  total: number;
  byType: Record<string, number>;
  unresolved: number;
}

export interface DependencyProcessorDeps {
  getAllIntegrations: () => Promise<IntegrationData[]>;
  getSystemBySlug: (slug: string) => Promise<{ id: string } | null>;
  getAllKafkaTopics: () => Promise<KafkaTopicData[]>;
  getAllDatabases: () => Promise<DatabaseData[]>;
  replaceAllDependencies: (deps: ResolvedDependency[]) => Promise<void>;
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
