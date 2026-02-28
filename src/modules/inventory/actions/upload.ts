"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { InventoryUploadSchema } from "../validators/inventory-upload";
import { processInventory } from "../services/process-inventory";
import type { SystemInventory } from "../types";

export interface UploadInventoryResult {
  success: boolean;
  uploadId?: string;
  systemsProcessed?: number;
  errors?: string[];
}

type PrismaIntegrationType =
  | "HTTP_API"
  | "DATABASE_DIRECT"
  | "GRPC"
  | "FILE_TRANSFER"
  | "OTHER";

const VALID_INTEGRATION_TYPES = new Set<string>([
  "HTTP_API",
  "DATABASE_DIRECT",
  "GRPC",
  "FILE_TRANSFER",
  "OTHER",
]);

function mapIntegrationType(type: string): PrismaIntegrationType {
  return VALID_INTEGRATION_TYPES.has(type)
    ? (type as PrismaIntegrationType)
    : "OTHER";
}

function mapPackageScope(
  type?: string,
): "INTERNAL" | "OPEN_SOURCE" | "TEST" {
  if (type === "INTERNAL" || type === "OPEN_SOURCE" || type === "TEST") {
    return type;
  }
  return "OPEN_SOURCE";
}

export async function uploadInventory(
  formData: FormData,
): Promise<UploadInventoryResult> {
  try {
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return { success: false, errors: ["No file provided"] };
    }

    let rawJson: unknown;
    try {
      const text = await file.text();
      rawJson = JSON.parse(text);
    } catch {
      return { success: false, errors: ["Invalid JSON file"] };
    }

    const validation = InventoryUploadSchema.safeParse(rawJson);
    if (!validation.success) {
      const errorMessages = validation.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
      return { success: false, errors: errorMessages };
    }

    const upload = await prisma.inventoryUpload.create({
      data: {
        filename: file.name,
        status: "PROCESSING",
        rawPayload: rawJson as object,
      },
    });

    const result = await processInventory(validation.data.systems, {
      upsertDomain: (name) =>
        prisma.domain.upsert({
          where: { name },
          create: { name },
          update: {},
        }),
      processSystem: (domainId, system) =>
        prisma.$transaction(async (tx) => {
          const upserted = await tx.system.upsert({
            where: { slug: system.slug },
            create: buildSystemData(domainId, system),
            update: buildSystemData(domainId, system),
          });

          await Promise.all([
            tx.service.deleteMany({ where: { systemId: upserted.id } }),
            tx.database.deleteMany({ where: { systemId: upserted.id } }),
            tx.integration.deleteMany({ where: { systemId: upserted.id } }),
            tx.kafkaTopic.deleteMany({ where: { systemId: upserted.id } }),
            tx.package.deleteMany({ where: { systemId: upserted.id } }),
            tx.apiEndpoint.deleteMany({ where: { systemId: upserted.id } }),
            tx.risk.deleteMany({ where: { systemId: upserted.id } }),
          ]);

          await createSystemChildren(tx, upserted.id, system);

          return { id: upserted.id };
        }),
    });

    const hasErrors = result.errors.length > 0;
    await prisma.inventoryUpload.update({
      where: { id: upload.id },
      data: {
        status:
          hasErrors && result.systemsProcessed === 0 ? "FAILED" : "COMPLETED",
        systemsCount: result.systemsProcessed,
        errors: hasErrors ? result.errors : undefined,
        processedAt: new Date(),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/graph");

    return {
      success: true,
      uploadId: upload.id,
      systemsProcessed: result.systemsProcessed,
      errors: hasErrors ? result.errors : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, errors: [message] };
  }
}

function buildSystemData(domainId: string, system: SystemInventory) {
  return {
    slug: system.slug,
    name: system.name,
    domainId,
    purpose: system.purpose,
    language: system.language,
    framework: system.framework,
    frameworkVersion: system.frameworkVersion,
    repositoryUrl: system.repositoryUrl,
    inventoryRaw: system as object,
  };
}

type TransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

async function createSystemChildren(
  tx: TransactionClient,
  systemId: string,
  system: SystemInventory,
) {
  const operations = [
    ...system.services.map((s) =>
      tx.service.create({
        data: { name: s.name, type: s.type, systemId },
      }),
    ),
    ...system.databases.map((d) =>
      tx.database.create({
        data: {
          name: d.name,
          provider: d.provider,
          version: d.version,
          orm: d.orm,
          systemId,
        },
      }),
    ),
    ...system.integrations.map((i) =>
      tx.integration.create({
        data: {
          name: i.targetSystem,
          type: mapIntegrationType(i.type),
          targetSystem: i.targetSystem,
          systemId,
        },
      }),
    ),
    ...system.kafkaTopics.map((k) =>
      tx.kafkaTopic.create({
        data: { name: k.name, role: k.role, systemId },
      }),
    ),
    ...system.packages.map((p) =>
      tx.package.create({
        data: {
          name: p.name,
          version: p.version,
          scope: mapPackageScope(p.type),
          systemId,
        },
      }),
    ),
    ...system.apiEndpoints.map((a) =>
      tx.apiEndpoint.create({
        data: {
          path: a.path,
          method: a.method,
          description: a.description,
          systemId,
        },
      }),
    ),
    ...system.risks.map((r) =>
      tx.risk.create({
        data: {
          title: r.title,
          description: r.description,
          severity: r.severity,
          systemId,
        },
      }),
    ),
  ];

  await Promise.all(operations);
}
