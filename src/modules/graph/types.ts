export interface KafkaTopicWithSystem {
  name: string;
  role: "PRODUCER" | "CONSUMER" | "BOTH";
  systemId: string;
}

export interface ResolvedDependency {
  sourceId: string;
  targetId: string;
  type: "KAFKA_TOPIC";
  label: string;
}
