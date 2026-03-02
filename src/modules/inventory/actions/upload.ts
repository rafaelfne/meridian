"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";
import { InventoryUploadSchema } from "../validators/inventory-upload";
import { processInventory } from "../services/process-inventory";
import { processDependenciesAction } from "@/modules/graph/actions/process";
import { saveGraphSnapshot } from "@/modules/graph/actions/save-snapshot";
import type { SystemInventory } from "../types";
import { generateServiceSlug, deduplicateServiceSlugs } from "../utils/service-slug";

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

    const workspaceId = formData.get("workspaceId");
    if (!workspaceId || typeof workspaceId !== "string") {
      return { success: false, errors: ["No workspaceId provided"] };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, errors: ["Authentication required"] };
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId,
        },
      },
    });

    if (!membership || membership.role === "VIEWER") {
      return { success: false, errors: ["Insufficient workspace permissions"] };
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
        workspaceId,
      },
    });

    const result = await processInventory(validation.data.systems, {
      upsertDomain: (name) =>
        prisma.domain.upsert({
          where: { workspaceId_name: { workspaceId, name } },
          create: { name, workspaceId },
          update: {},
        }),
      processSystem: (domainId, system) =>
        prisma.$transaction(
          async (tx) => {
            const upserted = await tx.system.upsert({
              where: { slug: system.slug },
              create: buildSystemData(domainId, system),
              update: buildSystemData(domainId, system),
            });

            await Promise.all([
              tx.service.deleteMany({ where: { systemId: upserted.id } }),
              tx.database.deleteMany({ where: { systemId: upserted.id } }),
              tx.integration.deleteMany({ where: { systemId: upserted.id } }),
              tx.messageTopic.deleteMany({ where: { systemId: upserted.id } }),
              tx.package.deleteMany({ where: { systemId: upserted.id } }),
              tx.apiEndpoint.deleteMany({ where: { systemId: upserted.id } }),
              tx.risk.deleteMany({ where: { systemId: upserted.id } }),
            ]);

            await createSystemChildren(tx, upserted.id, system);

            return { id: upserted.id };
          },
          { maxWait: 10_000, timeout: 30_000 },
        ),
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

    await processDependenciesAction();
    await saveGraphSnapshot(upload.id);

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
  const batches = [
    system.services.length > 0 &&
      tx.service.createMany({
        data: deduplicateServiceSlugs(
          system.services.map((s) => ({
            name: s.name,
            slug: s.slug ?? generateServiceSlug(s.name),
            type: s.type,
            systemId,
          })),
        ),
      }),
    system.databases.length > 0 &&
      tx.database.createMany({
        data: system.databases.map((d) => ({
          name: d.name,
          provider: d.provider,
          version: d.version,
          orm: d.orm,
          systemId,
        })),
      }),
    system.integrations.length > 0 &&
      tx.integration.createMany({
        data: system.integrations.map((i) => ({
          name: i.targetSystem,
          type: mapIntegrationType(i.type),
          targetSystem: i.targetSystem,
          systemId,
        })),
      }),
    system.messageTopics.length > 0 &&
      tx.messageTopic.createMany({
        data: system.messageTopics.map((k) => ({
          name: k.name,
          role: k.role,
          broker: k.broker,
          metadata: k.metadata
            ? (k.metadata as Prisma.InputJsonValue)
            : undefined,
          systemId,
        })),
      }),
    system.packages.length > 0 &&
      tx.package.createMany({
        data: system.packages.map((p) => ({
          name: p.name,
          version: p.version,
          scope: mapPackageScope(p.type),
          systemId,
        })),
      }),
    system.apiEndpoints.length > 0 &&
      tx.apiEndpoint.createMany({
        data: system.apiEndpoints.map((a) => ({
          path: a.path,
          method: a.method,
          description: a.description,
          systemId,
        })),
      }),
    system.risks.length > 0 &&
      tx.risk.createMany({
        data: system.risks.map((r) => ({
          title: r.title,
          description: r.description,
          severity: r.severity,
          systemId,
        })),
      }),
  ].filter(Boolean);

  await Promise.all(batches);
}

export async function uploadInventoryAction(
  _prevState: UploadInventoryResult,
  formData: FormData,
): Promise<UploadInventoryResult> {
  return uploadInventory(formData);
}
