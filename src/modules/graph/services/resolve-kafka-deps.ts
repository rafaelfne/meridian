import type { KafkaTopicWithSystem, ResolvedDependency } from "../types";

export interface ResolveKafkaDepsDeps {
  getAllKafkaTopicsWithSystem: () => Promise<KafkaTopicWithSystem[]>;
}

const PRODUCER_ROLES = new Set<string>(["PRODUCER", "BOTH"]);
const CONSUMER_ROLES = new Set<string>(["CONSUMER", "BOTH"]);

export async function resolveKafkaDeps(
  deps: ResolveKafkaDepsDeps,
): Promise<ResolvedDependency[]> {
  const topics = await deps.getAllKafkaTopicsWithSystem();

  const grouped = new Map<string, KafkaTopicWithSystem[]>();
  for (const topic of topics) {
    const existing = grouped.get(topic.name);
    if (existing) {
      existing.push(topic);
    } else {
      grouped.set(topic.name, [topic]);
    }
  }

  const seen = new Set<string>();
  const results: ResolvedDependency[] = [];

  for (const [topicName, entries] of grouped) {
    const producers = entries.filter((e) => PRODUCER_ROLES.has(e.role));
    const consumers = entries.filter((e) => CONSUMER_ROLES.has(e.role));

    for (const producer of producers) {
      for (const consumer of consumers) {
        if (producer.systemId === consumer.systemId) continue;

        const key = `${producer.systemId}:${consumer.systemId}:${topicName}`;
        if (seen.has(key)) continue;
        seen.add(key);

        results.push({
          sourceId: producer.systemId,
          targetId: consumer.systemId,
          type: "KAFKA_TOPIC",
          label: topicName,
        });
      }
    }
  }

  return results;
}
