"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { processDependencies } from "../processors/dependency-processor";
import type { DependencyType } from "@/generated/prisma/client";

export async function processDependenciesAction() {
  const result = await processDependencies({
    getAllIntegrations: () =>
      prisma.integration.findMany({
        select: { systemId: true, targetSystem: true, type: true },
      }),
    getSystemBySlug: (slug) =>
      prisma.system.findUnique({
        where: { slug },
        select: { id: true },
      }),
    getAllKafkaTopics: () =>
      prisma.kafkaTopic.findMany({
        select: { systemId: true, name: true, role: true },
      }),
    getAllDatabases: () =>
      prisma.database.findMany({
        select: { systemId: true, name: true, provider: true },
      }),
    replaceAllDependencies: async (deps) => {
      await prisma.$transaction(async (tx) => {
        await tx.dependency.deleteMany();
        if (deps.length > 0) {
          await tx.dependency.createMany({
            data: deps.map((d) => ({
              ...d,
              type: d.type as DependencyType,
            })),
          });
        }
      });
    },
  });

  revalidatePath("/graph");

  return result;
}
