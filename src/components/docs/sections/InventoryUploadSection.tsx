import { CodeBlock } from "../markdoc/CodeBlock";
import { Callout } from "../markdoc/Callout";

const SCHEMA_REFERENCE = `{
  "systems": [
    {
      // Required fields
      "name": "string",          // Human-readable system name
      "slug": "string",          // URL-safe identifier: ^[a-z0-9]+(?:-[a-z0-9]+)*$

      // Optional metadata
      "domainName": "string",    // Business domain (e.g., "Payments")
      "purpose": "string",       // Short description of what this system does
      "language": "string",      // Primary programming language (e.g., "TypeScript")
      "framework": "string",     // Framework name (e.g., "NestJS")
      "frameworkVersion": "string",
      "repositoryUrl": "string", // Valid URL to the source code repository

      // Services exposed by the system
      "services": [
        {
          "name": "string",      // Required
          "slug": "string",      // Optional, same pattern as system slug
          "type": "API | WORKER | CRONJOB | BACKGROUND_SERVICE",  // Required
          "port": 3000,          // Optional, positive integer
          "path": "string"       // Optional, e.g., "/api"
        }
      ],

      // Databases this system owns or connects to
      "databases": [
        {
          "name": "string",      // Required (e.g., "payments_db")
          "provider": "string",  // Required (e.g., "PostgreSQL", "MongoDB")
          "version": "string",   // Optional
          "orm": "string"        // Optional (e.g., "Prisma", "SQLAlchemy")
        }
      ],

      // Outbound integrations to other systems
      "integrations": [
        {
          "targetSystem": "string",  // Required - target system name or slug
          "type": "HTTP_API | DATABASE_DIRECT | GRPC | MESSAGE_QUEUE | EVENT_STREAM | FILE_TRANSFER | SDK | OTHER",
          "description": "string"   // Optional
        }
      ],

      // Message broker topics this system produces or consumes
      "messageTopics": [
        {
          "name": "string",      // Required (e.g., "payment.completed")
          "role": "PRODUCER | CONSUMER | BOTH",  // Required
          "broker": "KAFKA | RABBITMQ | SQS | SNS | OTHER",  // Required
          "metadata": {          // Optional
            "consumerGroup": "string",
            "exchange": "string",
            "routingKey": "string",
            "dlqEnabled": true,
            "retryPolicy": "string"
          }
        }
      ],

      // External and internal package dependencies
      "packages": [
        {
          "name": "string",      // Required (e.g., "stripe")
          "version": "string",   // Optional (e.g., "^14.0.0")
          "type": "INTERNAL | OPEN_SOURCE | TEST"  // Optional
        }
      ],

      // HTTP API endpoints exposed by the system
      "apiEndpoints": [
        {
          "path": "string",      // Required (e.g., "/payments/charge")
          "method": "string",    // Required (e.g., "POST")
          "description": "string" // Optional
        }
      ],

      // Known risks and technical debt
      "risks": [
        {
          "title": "string",     // Required
          "description": "string", // Optional
          "severity": "LOW | MEDIUM | HIGH | CRITICAL"  // Required
        }
      ]
    }
  ]
}`;

const EXAMPLE_INVENTORY = `{
  "systems": [
    {
      "name": "Payments Service",
      "slug": "payments-service",
      "domainName": "Payments",
      "purpose": "Processes payment transactions and emits events to downstream systems",
      "language": "TypeScript",
      "framework": "NestJS",
      "frameworkVersion": "10.3.0",
      "repositoryUrl": "https://github.com/acme/payments-service",

      "services": [
        {
          "name": "payments-api",
          "slug": "payments-api",
          "type": "API",
          "port": 3001,
          "path": "/api"
        },
        {
          "name": "charge-worker",
          "slug": "charge-worker",
          "type": "WORKER"
        }
      ],

      "databases": [
        {
          "name": "payments_db",
          "provider": "PostgreSQL",
          "version": "15",
          "orm": "Prisma"
        }
      ],

      "integrations": [
        {
          "targetSystem": "orders-service",
          "type": "HTTP_API",
          "description": "Fetches order details before processing payment"
        },
        {
          "targetSystem": "fraud-service",
          "type": "GRPC",
          "description": "Real-time fraud scoring"
        }
      ],

      "messageTopics": [
        {
          "name": "payment.completed",
          "role": "PRODUCER",
          "broker": "KAFKA",
          "metadata": {
            "dlqEnabled": true,
            "retryPolicy": "exponential-backoff"
          }
        },
        {
          "name": "payment.failed",
          "role": "PRODUCER",
          "broker": "KAFKA"
        }
      ],

      "packages": [
        { "name": "stripe", "version": "^14.0.0", "type": "OPEN_SOURCE" },
        { "name": "@acme/shared-auth", "version": "2.1.0", "type": "INTERNAL" }
      ],

      "apiEndpoints": [
        { "path": "/payments/charge", "method": "POST", "description": "Initiates a payment" },
        { "path": "/payments/{id}", "method": "GET", "description": "Retrieves payment status" }
      ],

      "risks": [
        {
          "title": "No circuit breaker on orders-service call",
          "description": "If orders-service is slow, payments will queue up and degrade",
          "severity": "HIGH"
        },
        {
          "title": "Stripe API key stored in plain-text env var",
          "severity": "CRITICAL"
        }
      ]
    }
  ]
}`;

export async function InventoryUploadSection() {
  return (
    <section id="inventory-upload">
      <h2>Inventory Upload</h2>
      <p>
        Meridian ingests your architecture as structured JSON files called inventories. Each file
        describes one or more systems — their services, databases, integrations, message topics,
        packages, and risks. After upload, Meridian automatically resolves dependency edges between
        systems and updates the graph.
      </p>

      <h3 id="inventory-drag-drop">Drag-and-drop upload</h3>
      <p>
        Navigate to <strong>Upload</strong> in the workspace header. The page displays a drop zone
        where you can drag and drop one or more <code>.json</code> files. You can also click the
        zone to open a file picker.
      </p>
      <p>After selecting your files, Meridian will:</p>
      <ol>
        <li>Validate the JSON structure against the inventory schema</li>
        <li>Upsert domains and systems (create or update based on slug)</li>
        <li>Replace all nested components (services, databases, integrations, etc.)</li>
        <li>Re-run dependency resolution and update all edges in the graph</li>
        <li>Create an upload record with status <code>COMPLETED</code> or <code>FAILED</code></li>
      </ol>
      <Callout type="warning" title="Existing data is replaced on upload">
        Uploading a new inventory for a system that already exists replaces all its nested
        components (services, databases, integrations, risks, etc.). The dependency graph is
        fully recalculated after each upload. Previous graph snapshots are preserved for the
        time machine feature.
      </Callout>

      <h3 id="inventory-schema">JSON schema reference</h3>
      <p>
        The inventory file must contain a top-level <code>systems</code> array with at least one
        entry. Each system requires a <code>name</code> and a <code>slug</code>. All other fields
        are optional but provide richer graph resolution and documentation.
      </p>
      <CodeBlock content={SCHEMA_REFERENCE} language="jsonc" />

      <h3 id="inventory-example">Complete example</h3>
      <p>
        The following example shows a complete inventory for a payments service with HTTP and gRPC
        outbound integrations, Kafka producer topics, a PostgreSQL database, external and internal
        packages, API endpoints, and two risks:
      </p>
      <CodeBlock content={EXAMPLE_INVENTORY} language="json" />
    </section>
  );
}
