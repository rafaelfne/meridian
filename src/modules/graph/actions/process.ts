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
    const result = await processDependencies({
      resolveHttp: () =>
        resolveHttpDependencies(
          () => prisma.integration.findMany(),
          (slug) =>
            prisma.system.findUnique({
              where: { slug },
              select: { id: true, slug: true, name: true },
            }),
          async (serviceSlug) => {
            const service = await prisma.service.findUnique({
              where: { slug: serviceSlug },
              select: { system: { select: { id: true, slug: true, name: true } } },
            });
            return service?.system ?? null;
          },
        ),
      resolveDatabase: () =>
        resolveDatabaseDeps({
          getAllDatabases: () =>
            prisma.database.findMany({
              select: { name: true, provider: true, systemId: true },
            }),
          getAllIntegrations: () =>
            prisma.integration.findMany({
              select: {
                name: true,
                type: true,
                targetSystem: true,
                systemId: true,
              },
            }),
          getSystemBySlug: (slug) =>
            prisma.system.findUnique({
              where: { slug },
              select: { id: true },
            }),
          getSystemByServiceSlug: async (serviceSlug) => {
            const service = await prisma.service.findUnique({
              where: { slug: serviceSlug },
              select: { system: { select: { id: true } } },
            });
            return service?.system ?? null;
          },
        }),
      resolveMessaging: () =>
        resolveMessagingDeps({
          getAllMessageTopicsWithSystem: () =>
            prisma.messageTopic.findMany({
              select: { name: true, role: true, broker: true, systemId: true },
            }),
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
