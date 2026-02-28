import type {
  DependencyProcessorDeps,
  ProcessDependenciesResult,
  ResolvedDependency,
} from "../types";

const INTEGRATION_TYPE_MAP: Record<string, string | null> = {
  HTTP_API: "HTTP_API",
  GRPC: "GRPC",
  DATABASE_DIRECT: "CROSS_DATABASE_QUERY",
  FILE_TRANSFER: "FILE_DEPENDENCY",
  GRAPHQL: "HTTP_API",
  SOAP: "HTTP_API",
  OTHER: null,
};

function dedupKey(dep: ResolvedDependency): string {
  return `${dep.sourceId}|${dep.targetId}|${dep.type}|${dep.label ?? ""}`;
}

export async function processDependencies(
  deps: DependencyProcessorDeps,
): Promise<ProcessDependenciesResult> {
  let unresolved = 0;
  const resolved: ResolvedDependency[] = [];
  const seen = new Set<string>();

  function addDep(dep: ResolvedDependency): void {
    const key = dedupKey(dep);
    if (!seen.has(key)) {
      seen.add(key);
      resolved.push(dep);
    }
  }

  // 1. Resolve integrations
  const integrations = await deps.getAllIntegrations();
  for (const integration of integrations) {
    if (!integration.targetSystem) {
      unresolved++;
      continue;
    }

    const mappedType = INTEGRATION_TYPE_MAP[integration.type] ?? null;
    if (mappedType === null) {
      unresolved++;
      continue;
    }

    const target = await deps.getSystemBySlug(integration.targetSystem);
    if (!target) {
      unresolved++;
      continue;
    }

    if (integration.systemId === target.id) {
      continue;
    }

    addDep({
      sourceId: integration.systemId,
      targetId: target.id,
      type: mappedType,
    });
  }

  // 2. Resolve kafka producer→consumer pairs
  const kafkaTopics = await deps.getAllKafkaTopics();
  const topicsByName = new Map<
    string,
    { producers: string[]; consumers: string[] }
  >();

  for (const topic of kafkaTopics) {
    let group = topicsByName.get(topic.name);
    if (!group) {
      group = { producers: [], consumers: [] };
      topicsByName.set(topic.name, group);
    }

    if (topic.role === "PRODUCER" || topic.role === "BOTH") {
      group.producers.push(topic.systemId);
    }
    if (topic.role === "CONSUMER" || topic.role === "BOTH") {
      group.consumers.push(topic.systemId);
    }
  }

  for (const [topicName, group] of topicsByName) {
    for (const producerId of group.producers) {
      for (const consumerId of group.consumers) {
        if (producerId === consumerId) {
          continue;
        }

        addDep({
          sourceId: producerId,
          targetId: consumerId,
          type: "KAFKA_TOPIC",
          label: topicName,
        });
      }
    }
  }

  // 3. Resolve shared databases
  const databases = await deps.getAllDatabases();
  const dbGroups = new Map<string, { systemIds: string[]; name: string }>();

  for (const db of databases) {
    const key = `${db.name}:${db.provider}`;
    let group = dbGroups.get(key);
    if (!group) {
      group = { systemIds: [], name: db.name };
      dbGroups.set(key, group);
    }
    group.systemIds.push(db.systemId);
  }

  for (const group of dbGroups.values()) {
    if (group.systemIds.length < 2) {
      continue;
    }

    for (let i = 0; i < group.systemIds.length; i++) {
      for (let j = i + 1; j < group.systemIds.length; j++) {
        const idA = group.systemIds[i]!;
        const idB = group.systemIds[j]!;
        const [sourceId, targetId] = idA < idB ? [idA, idB] : [idB, idA];

        addDep({
          sourceId,
          targetId,
          type: "SHARED_DATABASE",
          label: group.name,
        });
      }
    }
  }

  // 4. Persist all resolved dependencies
  await deps.replaceAllDependencies(resolved);

  // 5. Build result
  const byType: Record<string, number> = {};
  for (const dep of resolved) {
    byType[dep.type] = (byType[dep.type] ?? 0) + 1;
  }

  return {
    total: resolved.length,
    byType,
    unresolved,
  };
}
