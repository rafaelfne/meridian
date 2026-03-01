# Inventory JSON Schema

This document describes the JSON schema used to upload system inventories to Meridian. The schema is validated at runtime using [Zod](https://zod.dev/) — see `src/modules/inventory/validators/inventory-schema.ts` for the source of truth.

## Root Object

The upload payload is a single JSON object with a `systems` array:

```json
{
  "systems": [ /* one or more SystemInventory objects */ ]
}
```

| Field     | Type                | Required | Description                      |
| --------- | ------------------- | -------- | -------------------------------- |
| `systems` | `SystemInventory[]` | ✅        | At least one system is required. |

---

## SystemInventory

Each entry in the `systems` array describes one software system.

| Field              | Type             | Required | Description                                                                                |
| ------------------ | ---------------- | -------- | ------------------------------------------------------------------------------------------ |
| `name`             | `string`         | ✅        | Human-readable system name (min 1 char).                                                   |
| `slug`             | `string`         | ✅        | URL-safe identifier. Must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`.                              |
| `domainName`       | `string`         | —        | Domain to assign the system to. Auto-created if it doesn't exist. Defaults to `"Default"`. |
| `purpose`          | `string`         | —        | Brief description of the system's role.                                                    |
| `language`         | `string`         | —        | Primary programming language (e.g., `"TypeScript"`, `"C#"`).                               |
| `framework`        | `string`         | —        | Framework name (e.g., `"Next.js"`, `".NET"`).                                              |
| `frameworkVersion` | `string`         | —        | Framework version.                                                                         |
| `repositoryUrl`    | `string` (URL)   | —        | Must be a valid URL if provided.                                                           |
| `services`         | `Service[]`      | —        | Defaults to `[]`.                                                                          |
| `databases`        | `Database[]`     | —        | Defaults to `[]`.                                                                          |
| `integrations`     | `Integration[]`  | —        | Defaults to `[]`.                                                                          |
| `messageTopics`    | `MessageTopic[]` | —        | Defaults to `[]`.                                                                          |
| `packages`         | `Package[]`      | —        | Defaults to `[]`.                                                                          |
| `apiEndpoints`     | `ApiEndpoint[]`  | —        | Defaults to `[]`.                                                                          |
| `risks`            | `Risk[]`         | —        | Defaults to `[]`.                                                                          |

---

## Service

A deployable unit within a system.

| Field  | Type     | Required | Description                                               |
| ------ | -------- | -------- | --------------------------------------------------------- |
| `name` | `string` | ✅        | Service name (min 1 char).                                |
| `type` | `enum`   | ✅        | One of: `API`, `WORKER`, `CRONJOB`, `BACKGROUND_SERVICE`. |
| `port` | `number` | —        | Positive integer.                                         |
| `path` | `string` | —        | Base path (e.g., `"/api/auth"`).                          |

---

## Database

A data store used by the system.

| Field      | Type     | Required | Description                                                               |
| ---------- | -------- | -------- | ------------------------------------------------------------------------- |
| `name`     | `string` | ✅        | Database name (min 1 char).                                               |
| `provider` | `string` | ✅        | Database provider (e.g., `"PostgreSQL"`, `"MySQL"`, `"MongoDB"`).         |
| `version`  | `string` | —        | Database version.                                                         |
| `orm`      | `string` | —        | ORM or query library (e.g., `"Prisma"`, `"Entity Framework Core 8.0.8"`). |

---

## Integration

A synchronous dependency on another system.

| Field          | Type     | Required | Description                                                                                                      |
| -------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `targetSystem` | `string` | ✅        | Slug of the target system (min 1 char).                                                                          |
| `type`         | `enum`   | ✅        | One of: `HTTP_API`, `DATABASE_DIRECT`, `GRPC`, `MESSAGE_QUEUE`, `EVENT_STREAM`, `FILE_TRANSFER`, `SDK`, `OTHER`. |
| `description`  | `string` | —        | Human-readable description of the integration.                                                                   |

---

## MessageTopic

An asynchronous messaging topic or queue.

| Field      | Type     | Required | Description                                                                                         |
| ---------- | -------- | -------- | --------------------------------------------------------------------------------------------------- |
| `name`     | `string` | ✅        | Topic or queue name (min 1 char).                                                                   |
| `role`     | `enum`   | ✅        | One of: `PRODUCER`, `CONSUMER`, `BOTH`.                                                             |
| `broker`   | `enum`   | ✅        | One of: `KAFKA`, `RABBITMQ`, `SQS`, `SNS`, `OTHER`.                                                 |
| `metadata` | `object` | —        | Optional metadata with known optional fields below. Additional fields are accepted (`passthrough`). |

### MessageTopic Metadata

| Field           | Type      | Description                             |
| --------------- | --------- | --------------------------------------- |
| `consumerGroup` | `string`  | Consumer group identifier.              |
| `exchange`      | `string`  | RabbitMQ exchange name.                 |
| `routingKey`    | `string`  | RabbitMQ routing key.                   |
| `dlqEnabled`    | `boolean` | Whether a dead-letter queue is enabled. |
| `retryPolicy`   | `string`  | Retry policy description.               |

---

## Package

A library dependency of the system.

| Field     | Type     | Required | Description                                |
| --------- | -------- | -------- | ------------------------------------------ |
| `name`    | `string` | ✅        | Package name (min 1 char).                 |
| `version` | `string` | —        | Semantic version.                          |
| `type`    | `enum`   | —        | One of: `INTERNAL`, `OPEN_SOURCE`, `TEST`. |

---

## ApiEndpoint

A public API endpoint exposed by the system.

| Field         | Type     | Required | Description                            |
| ------------- | -------- | -------- | -------------------------------------- |
| `path`        | `string` | ✅        | Endpoint path (e.g., `"/v1/orders"`).  |
| `method`      | `string` | ✅        | HTTP method (e.g., `"GET"`, `"POST"`). |
| `description` | `string` | —        | What the endpoint does.                |

---

## Risk

A known risk or concern for the system.

| Field         | Type     | Required | Description                                  |
| ------------- | -------- | -------- | -------------------------------------------- |
| `title`       | `string` | ✅        | Short risk title (min 1 char).               |
| `description` | `string` | —        | Detailed description.                        |
| `severity`    | `enum`   | ✅        | One of: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. |

---

## Minimal Example

```json
{
  "systems": [
    {
      "name": "Auth Service",
      "slug": "auth-service",
      "domainName": "Platform",
      "purpose": "Handles authentication",
      "language": "TypeScript",
      "framework": "Next.js",
      "services": [
        { "name": "auth-api", "type": "API" }
      ],
      "databases": [
        { "name": "auth-db", "provider": "PostgreSQL" }
      ],
      "integrations": [
        { "targetSystem": "user-service", "type": "HTTP_API" }
      ]
    }
  ]
}
```

## Full Example

See [`examples/apollo-inventory.json`](../examples/apollo-inventory.json) and [`examples/grifo-inventory.json`](../examples/grifo-inventory.json) for production-like examples.
