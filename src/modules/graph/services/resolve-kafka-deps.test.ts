import { describe, it, expect, vi } from "vitest";
import {
  resolveKafkaDeps,
  type ResolveKafkaDepsDeps,
} from "./resolve-kafka-deps";
import type { KafkaTopicWithSystem } from "../types";

function buildDeps(
  topics: KafkaTopicWithSystem[] = [],
): ResolveKafkaDepsDeps {
  return {
    getAllKafkaTopicsWithSystem: vi.fn().mockResolvedValue(topics),
  };
}

describe("resolveKafkaDeps", () => {
  it("returns empty array when there are no topics", async () => {
    const result = await resolveKafkaDeps(buildDeps([]));
    expect(result).toEqual([]);
  });

  it("creates a dependency from PRODUCER to CONSUMER on same topic", async () => {
    const topics: KafkaTopicWithSystem[] = [
      { name: "orders", role: "PRODUCER", systemId: "sys-a" },
      { name: "orders", role: "CONSUMER", systemId: "sys-b" },
    ];

    const result = await resolveKafkaDeps(buildDeps(topics));

    expect(result).toEqual([
      {
        sourceId: "sys-a",
        targetId: "sys-b",
        type: "KAFKA_TOPIC",
        label: "orders",
      },
    ]);
  });

  it("does not create self-loops", async () => {
    const topics: KafkaTopicWithSystem[] = [
      { name: "events", role: "PRODUCER", systemId: "sys-a" },
      { name: "events", role: "CONSUMER", systemId: "sys-a" },
    ];

    const result = await resolveKafkaDeps(buildDeps(topics));
    expect(result).toEqual([]);
  });

  it("handles BOTH role as both producer and consumer", async () => {
    const topics: KafkaTopicWithSystem[] = [
      { name: "events", role: "BOTH", systemId: "sys-a" },
      { name: "events", role: "CONSUMER", systemId: "sys-b" },
      { name: "events", role: "PRODUCER", systemId: "sys-c" },
    ];

    const result = await resolveKafkaDeps(buildDeps(topics));

    expect(result).toContainEqual({
      sourceId: "sys-a",
      targetId: "sys-b",
      type: "KAFKA_TOPIC",
      label: "events",
    });
    expect(result).toContainEqual({
      sourceId: "sys-c",
      targetId: "sys-a",
      type: "KAFKA_TOPIC",
      label: "events",
    });
  });

  it("crosses BOTH × BOTH between different systems", async () => {
    const topics: KafkaTopicWithSystem[] = [
      { name: "sync", role: "BOTH", systemId: "sys-a" },
      { name: "sync", role: "BOTH", systemId: "sys-b" },
    ];

    const result = await resolveKafkaDeps(buildDeps(topics));

    expect(result).toContainEqual({
      sourceId: "sys-a",
      targetId: "sys-b",
      type: "KAFKA_TOPIC",
      label: "sync",
    });
    expect(result).toContainEqual({
      sourceId: "sys-b",
      targetId: "sys-a",
      type: "KAFKA_TOPIC",
      label: "sync",
    });
    expect(result).toHaveLength(2);
  });

  it("does not create dependencies for unrelated topics", async () => {
    const topics: KafkaTopicWithSystem[] = [
      { name: "orders", role: "PRODUCER", systemId: "sys-a" },
      { name: "payments", role: "CONSUMER", systemId: "sys-b" },
    ];

    const result = await resolveKafkaDeps(buildDeps(topics));
    expect(result).toEqual([]);
  });

  it("does not create dependencies when only producers exist", async () => {
    const topics: KafkaTopicWithSystem[] = [
      { name: "orders", role: "PRODUCER", systemId: "sys-a" },
      { name: "orders", role: "PRODUCER", systemId: "sys-b" },
    ];

    const result = await resolveKafkaDeps(buildDeps(topics));
    expect(result).toEqual([]);
  });

  it("does not create dependencies when only consumers exist", async () => {
    const topics: KafkaTopicWithSystem[] = [
      { name: "orders", role: "CONSUMER", systemId: "sys-a" },
      { name: "orders", role: "CONSUMER", systemId: "sys-b" },
    ];

    const result = await resolveKafkaDeps(buildDeps(topics));
    expect(result).toEqual([]);
  });

  it("handles multiple topics across multiple systems", async () => {
    const topics: KafkaTopicWithSystem[] = [
      { name: "orders", role: "PRODUCER", systemId: "sys-a" },
      { name: "orders", role: "CONSUMER", systemId: "sys-b" },
      { name: "orders", role: "CONSUMER", systemId: "sys-c" },
      { name: "payments", role: "PRODUCER", systemId: "sys-b" },
      { name: "payments", role: "CONSUMER", systemId: "sys-a" },
    ];

    const result = await resolveKafkaDeps(buildDeps(topics));

    expect(result).toContainEqual({
      sourceId: "sys-a",
      targetId: "sys-b",
      type: "KAFKA_TOPIC",
      label: "orders",
    });
    expect(result).toContainEqual({
      sourceId: "sys-a",
      targetId: "sys-c",
      type: "KAFKA_TOPIC",
      label: "orders",
    });
    expect(result).toContainEqual({
      sourceId: "sys-b",
      targetId: "sys-a",
      type: "KAFKA_TOPIC",
      label: "payments",
    });
    expect(result).toHaveLength(3);
  });

  it("deduplicates same source-target-topic combinations", async () => {
    const topics: KafkaTopicWithSystem[] = [
      { name: "events", role: "BOTH", systemId: "sys-a" },
      { name: "events", role: "PRODUCER", systemId: "sys-a" },
      { name: "events", role: "CONSUMER", systemId: "sys-b" },
    ];

    const result = await resolveKafkaDeps(buildDeps(topics));

    expect(result).toEqual([
      {
        sourceId: "sys-a",
        targetId: "sys-b",
        type: "KAFKA_TOPIC",
        label: "events",
      },
    ]);
  });

  it("uses topic name as label", async () => {
    const topics: KafkaTopicWithSystem[] = [
      { name: "my.custom.topic-name", role: "PRODUCER", systemId: "sys-a" },
      { name: "my.custom.topic-name", role: "CONSUMER", systemId: "sys-b" },
    ];

    const result = await resolveKafkaDeps(buildDeps(topics));

    expect(result[0]?.label).toBe("my.custom.topic-name");
  });
});
