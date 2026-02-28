import type {
  Dependency,
  DependencyResult,
  ResolvedDependency,
  ResolveHttpDepsResult,
} from "../types";

/** Common shape that all resolved dependencies are normalized into. */
export interface NormalizedDependency {
  sourceId: string;
  targetId: string;
  type: string;
  label: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ProcessDependenciesResult {
  total: number;
  byType: Record<string, number>;
  unresolved: number;
}

export interface DependencyProcessorDeps {
  resolveHttp: () => Promise<ResolveHttpDepsResult>;
  resolveDatabase: () => Promise<DependencyResult[]>;
  resolveKafka: () => Promise<ResolvedDependency[]>;
  resolvePackage: () => Promise<DependencyResult[]>;
  persistDependencies: (deps: NormalizedDependency[]) => Promise<void>;
}

function normalizeHttpDeps(deps: Dependency[]): NormalizedDependency[] {
  return deps.map((d) => ({
    sourceId: d.sourceId,
    targetId: d.targetId,
    type: d.type,
    label: d.label,
    metadata: d.metadata,
  }));
}

function normalizeDependencyResults(
  deps: DependencyResult[],
): NormalizedDependency[] {
  return deps.map((d) => ({
    sourceId: d.sourceId,
    targetId: d.targetId,
    type: d.type,
    label: d.label ?? null,
    metadata: null,
  }));
}

function normalizeKafkaDeps(
  deps: ResolvedDependency[],
): NormalizedDependency[] {
  return deps.map((d) => ({
    sourceId: d.sourceId,
    targetId: d.targetId,
    type: d.type,
    label: d.label,
    metadata: null,
  }));
}

/**
 * Orchestrates all dependency resolvers, normalizes results, persists them,
 * and returns summary statistics.
 */
export async function processDependencies(
  deps: DependencyProcessorDeps,
): Promise<ProcessDependenciesResult> {
  const [httpResult, databaseDeps, kafkaDeps, packageDeps] = await Promise.all([
    deps.resolveHttp(),
    deps.resolveDatabase(),
    deps.resolveKafka(),
    deps.resolvePackage(),
  ]);

  const allDependencies: NormalizedDependency[] = [
    ...normalizeHttpDeps(httpResult.resolved),
    ...normalizeDependencyResults(databaseDeps),
    ...normalizeKafkaDeps(kafkaDeps),
    ...normalizeDependencyResults(packageDeps),
  ];

  await deps.persistDependencies(allDependencies);

  const byType: Record<string, number> = {};
  for (const dep of allDependencies) {
    byType[dep.type] = (byType[dep.type] ?? 0) + 1;
  }

  return {
    total: allDependencies.length,
    byType,
    unresolved: httpResult.unresolved.length,
  };
}
