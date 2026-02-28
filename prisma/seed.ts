import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ── Domain ────────────────────────────────────────────
  const domain = await prisma.domain.upsert({
    where: { name: "Financial Services" },
    update: {},
    create: {
      name: "Financial Services",
      description: "Core financial services domain including payments and billing",
    },
  });

  // ── System: Grifo ─────────────────────────────────────
  const grifo = await prisma.system.upsert({
    where: { slug: "grifo" },
    update: {},
    create: {
      name: "Grifo",
      slug: "grifo",
      purpose: "Core financial API for payment processing and billing management",
      language: "Java",
      framework: "Spring Boot",
      frameworkVersion: "3.2.0",
      repositoryUrl: "https://github.com/example/grifo",
      domainId: domain.id,
      inventoryRaw: {
        scannedAt: "2026-01-15T10:00:00Z",
        source: "manual",
      },
    },
  });

  // ── Services ──────────────────────────────────────────
  await prisma.service.createMany({
    data: [
      { name: "grifo-api", type: "API", systemId: grifo.id },
      { name: "grifo-worker", type: "WORKER", systemId: grifo.id },
      { name: "grifo-scheduler", type: "CRONJOB", systemId: grifo.id },
    ],
    skipDuplicates: true,
  });

  // ── Database ──────────────────────────────────────────
  await prisma.database.createMany({
    data: [
      {
        name: "grifo_db",
        provider: "PostgreSQL",
        version: "16",
        orm: "Hibernate",
        tables: ["payments", "invoices", "customers", "transactions"],
        systemId: grifo.id,
      },
    ],
    skipDuplicates: true,
  });

  // ── Integrations ──────────────────────────────────────
  await prisma.integration.createMany({
    data: [
      {
        name: "Payment Gateway",
        type: "HTTP_API",
        targetSystem: "payment-gateway",
        url: "https://api.payment-gateway.example.com",
        protocol: "REST",
        systemId: grifo.id,
      },
      {
        name: "Notification Service",
        type: "GRPC",
        targetSystem: "notification-service",
        protocol: "gRPC",
        systemId: grifo.id,
      },
    ],
    skipDuplicates: true,
  });

  // ── Message Topics ─────────────────────────────────────
  await prisma.messageTopic.createMany({
    data: [
      { name: "payments.completed", role: "PRODUCER", broker: "KAFKA", systemId: grifo.id },
      { name: "invoices.created", role: "PRODUCER", broker: "KAFKA", systemId: grifo.id },
      { name: "customers.updated", role: "CONSUMER", broker: "KAFKA", systemId: grifo.id },
    ],
    skipDuplicates: true,
  });

  // ── Packages ──────────────────────────────────────────
  await prisma.package.createMany({
    data: [
      {
        name: "spring-boot-starter-web",
        version: "3.2.0",
        scope: "OPEN_SOURCE",
        systemId: grifo.id,
      },
      {
        name: "company-auth-lib",
        version: "2.1.0",
        scope: "INTERNAL",
        systemId: grifo.id,
      },
      {
        name: "spring-boot-starter-test",
        version: "3.2.0",
        scope: "TEST",
        systemId: grifo.id,
      },
    ],
    skipDuplicates: true,
  });

  // ── API Endpoints ─────────────────────────────────────
  await prisma.apiEndpoint.createMany({
    data: [
      {
        path: "/api/v1/payments",
        method: "POST",
        description: "Create a new payment",
        systemId: grifo.id,
      },
      {
        path: "/api/v1/payments/:id",
        method: "GET",
        description: "Get payment by ID",
        systemId: grifo.id,
      },
      {
        path: "/api/v1/invoices",
        method: "GET",
        description: "List invoices",
        systemId: grifo.id,
      },
    ],
    skipDuplicates: true,
  });

  // ── Risks ─────────────────────────────────────────────
  await prisma.risk.createMany({
    data: [
      {
        title: "Outdated authentication library",
        description:
          "The internal auth library has known vulnerabilities in versions < 3.0",
        severity: "HIGH",
        systemId: grifo.id,
      },
      {
        title: "No circuit breaker on Payment Gateway integration",
        description:
          "HTTP calls to the payment gateway lack circuit breaker pattern",
        severity: "MEDIUM",
        systemId: grifo.id,
      },
    ],
    skipDuplicates: true,
  });

  // ── Second System (for dependency example) ────────────
  const paymentGateway = await prisma.system.upsert({
    where: { slug: "payment-gateway" },
    update: {},
    create: {
      name: "Payment Gateway",
      slug: "payment-gateway",
      purpose: "External payment processing gateway",
      language: "Go",
      framework: "Gin",
      frameworkVersion: "1.9.1",
      domainId: domain.id,
    },
  });

  // ── Dependency ────────────────────────────────────────
  await prisma.dependency.upsert({
    where: {
      sourceId_targetId_type_label: {
        sourceId: grifo.id,
        targetId: paymentGateway.id,
        type: "HTTP_API",
        label: "Payment Processing",
      },
    },
    update: {},
    create: {
      sourceId: grifo.id,
      targetId: paymentGateway.id,
      type: "HTTP_API",
      label: "Payment Processing",
      metadata: {
        protocol: "REST",
        endpoints: ["/api/v1/charge", "/api/v1/refund"],
      },
    },
  });

  // ── Inventory Upload Example ──────────────────────────
  await prisma.inventoryUpload.create({
    data: {
      filename: "grifo-inventory-2026-01.json",
      status: "COMPLETED",
      systemsCount: 2,
      rawPayload: { systems: ["grifo", "payment-gateway"] },
      processedAt: new Date(),
    },
  });

  console.log("✅ Seed completed successfully");
  console.log(`   Domain: ${domain.name}`);
  console.log(`   Systems: ${grifo.name}, ${paymentGateway.name}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
