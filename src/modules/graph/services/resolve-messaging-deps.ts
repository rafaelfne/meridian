import type { MessageTopicWithSystem, ResolvedDependency } from "../types";

export interface ResolveMessagingDepsDeps {
  getAllMessageTopicsWithSystem: () => Promise<MessageTopicWithSystem[]>;
}

const PRODUCER_ROLES = new Set<string>(["PRODUCER", "BOTH"]);
const CONSUMER_ROLES = new Set<string>(["CONSUMER", "BOTH"]);

const BROKER_TO_DEPENDENCY_TYPE = {
  KAFKA: "KAFKA_TOPIC",
  RABBITMQ: "RABBITMQ_QUEUE",
  SQS: "SQS_QUEUE",
  SNS: "KAFKA_TOPIC",
  OTHER: "KAFKA_TOPIC",
} as const;

export async function resolveMessagingDeps(
  deps: ResolveMessagingDepsDeps,
): Promise<ResolvedDependency[]> {
  const topics = await deps.getAllMessageTopicsWithSystem();

  // Group by (broker + topic name) to prevent cross-broker matching
  const groupKey = (t: MessageTopicWithSystem) => `${t.broker}::${t.name}`;
  const grouped = new Map<string, MessageTopicWithSystem[]>();
  for (const topic of topics) {
    const key = groupKey(topic);
    const existing = grouped.get(key);
    if (existing) {
      existing.push(topic);
    } else {
      grouped.set(key, [topic]);
    }
  }

  const seen = new Set<string>();
  const results: ResolvedDependency[] = [];

  for (const [, entries] of grouped) {
    const producers = entries.filter((e) => PRODUCER_ROLES.has(e.role));
    const consumers = entries.filter((e) => CONSUMER_ROLES.has(e.role));

    for (const producer of producers) {
      for (const consumer of consumers) {
        if (producer.systemId === consumer.systemId) continue;

        const topicName = producer.name;
        const key = `${producer.systemId}:${consumer.systemId}:${producer.broker}:${topicName}`;
        if (seen.has(key)) continue;
        seen.add(key);

        results.push({
          sourceId: producer.systemId,
          targetId: consumer.systemId,
          type: BROKER_TO_DEPENDENCY_TYPE[producer.broker] ?? "KAFKA_TOPIC",
          label: `[${producer.broker}] ${topicName}`,
        });
      }
    }
  }

  return results;
}
