import { z } from "zod/v4";

export const ServiceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Service slug must contain only lowercase letters, numbers, and hyphens",
    )
    .optional(),
  type: z.enum(["API", "WORKER", "CRONJOB", "BACKGROUND_SERVICE"]),
  port: z.number().int().positive().optional(),
  path: z.string().optional(),
  datadogServiceTag: z.string().max(200).optional(),
});

export const DatabaseSchema = z.object({
  name: z.string().min(1, "Database name is required"),
  provider: z.string().min(1, "Database provider is required"),
  version: z.string().optional(),
  orm: z.string().optional(),
});

export const IntegrationSchema = z.object({
  targetSystem: z.string().min(1, "Target system is required"),
  type: z.enum([
    "HTTP_API",
    "DATABASE_DIRECT",
    "GRPC",
    "MESSAGE_QUEUE",
    "EVENT_STREAM",
    "FILE_TRANSFER",
    "SDK",
    "OTHER",
  ]),
  description: z.string().optional(),
});

export const MessageTopicSchema = z.object({
  name: z.string().min(1, "Topic name is required"),
  role: z.enum(["PRODUCER", "CONSUMER", "BOTH"]),
  broker: z.enum(["KAFKA", "RABBITMQ", "SQS", "SNS", "OTHER"]),
  metadata: z.object({
    consumerGroup: z.string().optional(),
    exchange: z.string().optional(),
    routingKey: z.string().optional(),
    dlqEnabled: z.boolean().optional(),
    retryPolicy: z.string().optional(),
  }).passthrough().optional(),
});

export const PackageSchema = z.object({
  name: z.string().min(1, "Package name is required"),
  version: z.string().optional(),
  type: z.enum(["INTERNAL", "OPEN_SOURCE", "TEST"]).optional(),
});

export const ApiEndpointSchema = z.object({
  path: z.string().min(1, "Endpoint path is required"),
  method: z.string().min(1, "HTTP method is required"),
  description: z.string().optional(),
});

export const RiskSchema = z.object({
  title: z.string().min(1, "Risk title is required"),
  description: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

export const SystemInventorySchema = z.object({
  name: z.string().min(1, "System name is required"),
  slug: z
    .string()
    .min(1, "System slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  domainName: z.string().min(1, "Domain name is required").optional(),
  purpose: z.string().optional(),
  language: z.string().optional(),
  framework: z.string().optional(),
  frameworkVersion: z.string().optional(),
  repositoryUrl: z.string().url().optional(),
  services: z.array(ServiceSchema).optional().default([]),
  databases: z.array(DatabaseSchema).optional().default([]),
  integrations: z.array(IntegrationSchema).optional().default([]),
  messageTopics: z.array(MessageTopicSchema).optional().default([]),
  packages: z.array(PackageSchema).optional().default([]),
  apiEndpoints: z.array(ApiEndpointSchema).optional().default([]),
  risks: z.array(RiskSchema).optional().default([]),
});

export const InventoryUploadSchema = z.object({
  systems: z
    .array(SystemInventorySchema)
    .min(1, "At least one system is required"),
});

export type InventoryUpload = z.infer<typeof InventoryUploadSchema>;
export type SystemInventory = z.infer<typeof SystemInventorySchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type Database = z.infer<typeof DatabaseSchema>;
export type Integration = z.infer<typeof IntegrationSchema>;
/** @deprecated Use MessageTopic instead. Kept for backward compatibility. */
export type KafkaTopic = z.infer<typeof MessageTopicSchema>;
export type MessageTopic = z.infer<typeof MessageTopicSchema>;
export type Package = z.infer<typeof PackageSchema>;
export type ApiEndpoint = z.infer<typeof ApiEndpointSchema>;
export type Risk = z.infer<typeof RiskSchema>;
