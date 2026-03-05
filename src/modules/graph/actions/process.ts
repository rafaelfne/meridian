"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DependencyType } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { resolveHttpDependencies } from "../services/resolve-http-deps";
import { resolveDatabaseDeps } from "../services/resolve-database-deps";
import { resolveMessagingDeps } from "../services/resolve-messaging-deps";

import {
  processDependencies,
  type ProcessDependenciesResult,
} from "../processors/dependency-processor";

export interface ProcessDependenciesActionResult {
  success: boolean;
  data?: ProcessDependenciesResult;
  error?: string;
}

export async function processDependenciesAction(): Promise<ProcessDependenciesActionResult> {
  try {
    // Batch-load all lookup data upfront to avoid N+1 queries in resolvers
    const [allSystems, allServices, allIntegrations, allDatabases, allTopics] =
      await Promise.all([
        prisma.system.findMany({
          select: { id: true, slug: true, name: true },
        }),
        prisma.service.findMany({
          select: {
            slug: true,
            system: { select: { id: true, slug: true, name: true } },
          },
        }),
        prisma.integration.findMany(),
        prisma.database.findMany({
          select: { name: true, provider: true, systemId: true },
        }),
        prisma.messageTopic.findMany({
          select: { name: true, role: true, broker: true, systemId: true },
        }),
      ]);

    const systemBySlug = new Map(allSystems.map((s) => [s.slug, s]));
    const systemByServiceSlug = new Map(
      allServices.map((s) => [s.slug, s.system]),
    );

    const result = await processDependencies({
      resolveHttp: () =>
        resolveHttpDependencies(
          async () => allIntegrations,
          async (slug) => systemBySlug.get(slug) ?? null,
          async (slug) => systemByServiceSlug.get(slug) ?? null,
        ),
      resolveDatabase: () =>
        resolveDatabaseDeps({
          getAllDatabases: async () => allDatabases,
          getAllIntegrations: async () =>
            allIntegrations.map((i) => ({
              name: i.name,
              type: i.type,
              targetSystem: i.targetSystem,
              systemId: i.systemId,
            })),
          getSystemBySlug: async (slug) => systemBySlug.get(slug) ?? null,
          getSystemByServiceSlug: async (slug) =>
            systemByServiceSlug.get(slug) ?? null,
        }),
      resolveMessaging: () =>
        resolveMessagingDeps({
          getAllMessageTopicsWithSystem: async () => allTopics,
        }),
      persistDependencies: (deps) =>
        prisma.$transaction(async (tx) => {
          await tx.dependency.deleteMany();
          if (deps.length > 0) {
            await tx.dependency.createMany({
              data: deps.map((d) => ({
                sourceId: d.sourceId,
                targetId: d.targetId,
                type: d.type as DependencyType,
                label: d.label ?? null,
                ...(d.metadata != null && {
                  metadata: d.metadata as Prisma.InputJsonValue,
                }),
              })),
            });
          }
        }),
    });

    revalidatePath("/graph");

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
