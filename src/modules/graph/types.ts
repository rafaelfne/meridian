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
