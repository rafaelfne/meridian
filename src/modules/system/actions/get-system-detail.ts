"use server";

import { prisma } from "@/lib/prisma";
import type { SystemDetail } from "../types";

export interface GetSystemDetailResult {
  success: boolean;
  data?: SystemDetail;
  error?: string;
}

export async function getSystemDetailAction(
  systemId: string,
): Promise<GetSystemDetailResult> {
  if (!systemId || systemId.trim() === "") {
    return { success: false, error: "System ID is required" };
  }

  try {
    const system = await prisma.system.findUnique({
      where: { id: systemId },
      select: {
        id: true,
        name: true,
        slug: true,
        purpose: true,
        language: true,
        framework: true,
        frameworkVersion: true,
        repositoryUrl: true,
        layer: true,
        domain: { select: { name: true } },
        services: {
          select: { id: true, name: true, type: true },
        },
        databases: {
          select: {
            id: true,
            name: true,
            provider: true,
            version: true,
            orm: true,
          },
        },
        integrations: {
          select: {
            id: true,
            name: true,
            type: true,
            targetSystem: true,
            url: true,
          },
        },
        messageTopics: {
          select: { id: true, name: true, role: true, broker: true },
        },
        packages: {
          select: { id: true, name: true, version: true, scope: true },
        },
        risks: {
          select: {
            id: true,
            title: true,
            description: true,
            severity: true,
          },
        },
        apiEndpoints: {
          select: { id: true, path: true, method: true, description: true },
        },
        dependsOn: {
          select: {
            id: true,
            type: true,
            label: true,
            target: { select: { id: true, name: true, slug: true } },
          },
        },
        dependedBy: {
          select: {
            id: true,
            type: true,
            label: true,
            source: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!system) {
      return { success: false, error: "System not found" };
    }

    // Map Prisma relation names to our type interface
    const data: SystemDetail = {
      ...system,
      dependsOn: system.dependsOn.map((d) => ({
        id: d.id,
        type: d.type,
        label: d.label,
        system: d.target,
      })),
      dependedBy: system.dependedBy.map((d) => ({
        id: d.id,
        type: d.type,
        label: d.label,
        system: d.source,
      })),
    };

    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch system detail:", error);
    return { success: false, error: "Failed to fetch system details" };
  }
}
