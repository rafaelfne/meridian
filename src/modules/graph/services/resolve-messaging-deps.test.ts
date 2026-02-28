import { describe, it, expect, vi } from "vitest";
import {
  resolveMessagingDeps,
  type ResolveMessagingDepsDeps,
} from "./resolve-messaging-deps";
import type { MessageTopicWithSystem } from "../types";

function buildDeps(
  topics: MessageTopicWithSystem[] = [],
): ResolveMessagingDepsDeps {
  return {
    getAllMessageTopicsWithSystem: vi.fn().mockResolvedValue(topics),
  };
}

describe("resolveMessagingDeps", () => {
  it("returns empty array when there are no topics", async () => {
    const result = await resolveMessagingDeps(buildDeps([]));
    expect(result).toEqual([]);
  });

  it("creates a dependency from PRODUCER to CONSUMER on same topic", async () => {
    const topics: MessageTopicWithSystem[] = [
      { name: "orders", role: "PRODUCER", broker: "KAFKA", systemId: "sys-a" },
      { name: "orders", role: "CONSUMER", broker: "KAFKA", systemId: "sys-b" },
    ];

    const result = await resolveMessagingDeps(buildDeps(topics));

    expect(result).toEqual([
      {
        sourceId: "sys-a",
        targetId: "sys-b",
        type: "KAFKA_TOPIC",
        label: "[KAFKA] orders",
      },
    ]);
  });

  it("does not create self-loops", async () => {
    const topics: MessageTopicWithSystem[] = [
      { name: "events", role: "PRODUCER", broker: "KAFKA", systemId: "sys-a" },
      { name: "events", role: "CONSUMER", broker: "KAFKA", systemId: "sys-a" },
    ];

    const result = await resolveMessagingDeps(buildDeps(topics));
    expect(result).toEqual([]);
  });

  it("handles BOTH role as both producer and consumer", async () => {
    const topics: MessageTopicWithSystem[] = [
      { name: "events", role: "BOTH", broker: "KAFKA", systemId: "sys-a" },
      { name: "events", role: "CONSUMER", broker: "KAFKA", systemId: "sys-b" },
      { name: "events", role: "PRODUCER", broker: "KAFKA", systemId: "sys-c" },
    ];

    const result = await resolveMessagingDeps(buildDeps(topics));

    expect(result).toContainEqual({
      sourceId: "sys-a",
      targetId: "sys-b",
      type: "KAFKA_TOPIC",
      label: "[KAFKA] events",
    });
    expect(result).toContainEqual({
      sourceId: "sys-c",
      targetId: "sys-a",
      type: "KAFKA_TOPIC",
      label: "[KAFKA] events",
    });
  });

  it("crosses BOTH × BOTH between different systems", async () => {
    const topics: MessageTopicWithSystem[] = [
      { name: "sync", role: "BOTH", broker: "KAFKA", systemId: "sys-a" },
      { name: "sync", role: "BOTH", broker: "KAFKA", systemId: "sys-b" },
    ];

    const result = await resolveMessagingDeps(buildDeps(topics));

    expect(result).toContainEqual({
      sourceId: "sys-a",
      targetId: "sys-b",
      type: "KAFKA_TOPIC",
      label: "[KAFKA] sync",
    });
    expect(result).toContainEqual({
      sourceId: "sys-b",
      targetId: "sys-a",
      type: "KAFKA_TOPIC",
      label: "[KAFKA] sync",
    });
    expect(result).toHaveLength(2);
  });

  it("does not create dependencies for unrelated topics", async () => {
    const topics: MessageTopicWithSystem[] = [
      { name: "orders", role: "PRODUCER", broker: "KAFKA", systemId: "sys-a" },
      { name: "payments", role: "CONSUMER", broker: "KAFKA", systemId: "sys-b" },
    ];

    const result = await resolveMessagingDeps(buildDeps(topics));
    expect(result).toEqual([]);
  });

  it("does not create dependencies when only producers exist", async () => {
    const topics: MessageTopicWithSystem[] = [
      { name: "orders", role: "PRODUCER", broker: "KAFKA", systemId: "sys-a" },
      { name: "orders", role: "PRODUCER", broker: "KAFKA", systemId: "sys-b" },
    ];

    const result = await resolveMessagingDeps(buildDeps(topics));
    expect(result).toEqual([]);
  });

  it("does not create dependencies when only consumers exist", async () => {
    const topics: MessageTopicWithSystem[] = [
      { name: "orders", role: "CONSUMER", broker: "KAFKA", systemId: "sys-a" },
      { name: "orders", role: "CONSUMER", broker: "KAFKA", systemId: "sys-b" },
    ];

    const result = await resolveMessagingDeps(buildDeps(topics));
    expect(result).toEqual([]);
  });

  it("handles multiple topics across multiple systems", async () => {
    const topics: MessageTopicWithSystem[] = [
      { name: "orders", role: "PRODUCER", broker: "KAFKA", systemId: "sys-a" },
      { name: "orders", role: "CONSUMER", broker: "KAFKA", systemId: "sys-b" },
      { name: "orders", role: "CONSUMER", broker: "KAFKA", systemId: "sys-c" },
      { name: "payments", role: "PRODUCER", broker: "KAFKA", systemId: "sys-b" },
      { name: "payments", role: "CONSUMER", broker: "KAFKA", systemId: "sys-a" },
    ];

    const result = await resolveMessagingDeps(buildDeps(topics));

    expect(result).toContainEqual({
      sourceId: "sys-a",
      targetId: "sys-b",
      type: "KAFKA_TOPIC",
      label: "[KAFKA] orders",
    });
    expect(result).toContainEqual({
      sourceId: "sys-a",
      targetId: "sys-c",
      type: "KAFKA_TOPIC",
      label: "[KAFKA] orders",
    });
    expect(result).toContainEqual({
      sourceId: "sys-b",
      targetId: "sys-a",
      type: "KAFKA_TOPIC",
      label: "[KAFKA] payments",
    });
    expect(result).toHaveLength(3);
  });

  it("deduplicates same source-target-topic combinations", async () => {
    const topics: MessageTopicWithSystem[] = [
      { name: "events", role: "BOTH", broker: "KAFKA", systemId: "sys-a" },
      { name: "events", role: "PRODUCER", broker: "KAFKA", systemId: "sys-a" },
      { name: "events", role: "CONSUMER", broker: "KAFKA", systemId: "sys-b" },
    ];

    const result = await resolveMessagingDeps(buildDeps(topics));

    expect(result).toEqual([
      {
        sourceId: "sys-a",
        targetId: "sys-b",
        type: "KAFKA_TOPIC",
        label: "[KAFKA] events",
      },
    ]);
  });

  it("includes broker prefix in label", async () => {
    const topics: MessageTopicWithSystem[] = [
      { name: "my.custom.topic-name", role: "PRODUCER", broker: "KAFKA", systemId: "sys-a" },
      { name: "my.custom.topic-name", role: "CONSUMER", broker: "KAFKA", systemId: "sys-b" },
    ];

    const result = await resolveMessagingDeps(buildDeps(topics));

    expect(result[0]?.label).toBe("[KAFKA] my.custom.topic-name");
  });

  it("maps RABBITMQ broker to RABBITMQ_QUEUE dependency type", async () => {
    const topics: MessageTopicWithSystem[] = [
      { name: "brokertools", role: "PRODUCER", broker: "RABBITMQ", systemId: "sys-a" },
      { name: "brokertools", role: "CONSUMER", broker: "RABBITMQ", systemId: "sys-b" },
    ];

    const result = await resolveMessagingDeps(buildDeps(topics));

    expect(result).toEqual([
      {
        sourceId: "sys-a",
        targetId: "sys-b",
        type: "RABBITMQ_QUEUE",
        label: "[RABBITMQ] brokertools",
      },
    ]);
  });

  it("maps SQS broker to SQS_QUEUE dependency type", async () => {
    const topics: MessageTopicWithSystem[] = [
      { name: "logging-queue", role: "PRODUCER", broker: "SQS", systemId: "sys-a" },
      { name: "logging-queue", role: "CONSUMER", broker: "SQS", systemId: "sys-b" },
    ];

    const result = await resolveMessagingDeps(buildDeps(topics));

    expect(result).toEqual([
      {
        sourceId: "sys-a",
        targetId: "sys-b",
        type: "SQS_QUEUE",
        label: "[SQS] logging-queue",
      },
    ]);
  });

  it("does not cross-match different brokers on same topic name", async () => {
    const topics: MessageTopicWithSystem[] = [
      { name: "orders", role: "PRODUCER", broker: "KAFKA", systemId: "sys-a" },
      { name: "orders", role: "CONSUMER", broker: "RABBITMQ", systemId: "sys-b" },
    ];

    const result = await resolveMessagingDeps(buildDeps(topics));
    expect(result).toEqual([]);
  });

  it("creates correct edges for mixed Kafka + RabbitMQ dataset", async () => {
    const topics: MessageTopicWithSystem[] = [
      { name: "orders", role: "PRODUCER", broker: "KAFKA", systemId: "sys-a" },
      { name: "orders", role: "CONSUMER", broker: "KAFKA", systemId: "sys-b" },
      { name: "brokertools", role: "PRODUCER", broker: "RABBITMQ", systemId: "sys-c" },
      { name: "brokertools", role: "CONSUMER", broker: "RABBITMQ", systemId: "sys-b" },
    ];

    const result = await resolveMessagingDeps(buildDeps(topics));

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      sourceId: "sys-a",
      targetId: "sys-b",
      type: "KAFKA_TOPIC",
      label: "[KAFKA] orders",
    });
    expect(result).toContainEqual({
      sourceId: "sys-c",
      targetId: "sys-b",
      type: "RABBITMQ_QUEUE",
      label: "[RABBITMQ] brokertools",
    });
  });

  it("no self-loops when same system is BOTH producer and consumer", async () => {
    const topics: MessageTopicWithSystem[] = [
      { name: "internal", role: "BOTH", broker: "RABBITMQ", systemId: "sys-a" },
    ];

    const result = await resolveMessagingDeps(buildDeps(topics));
    expect(result).toEqual([]);
  });
});
