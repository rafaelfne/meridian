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
      },
    });

    if (!system) {
      return { success: false, error: "System not found" };
    }

    return { success: true, data: system as SystemDetail };
  } catch (error) {
    console.error("Failed to fetch system detail:", error);
    return { success: false, error: "Failed to fetch system details" };
  }
}
