import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { ENUM_TO_SITE } from "@/modules/workspace/validators/datadog-integration-schema";
import {
  pollWorkspace,
  fetchApmServiceList,
} from "@/modules/datadog/services/poll-datadog-monitors";
import { reconcileIncidents } from "@/modules/status-page/services/reconcile-incidents";
import type { DatadogMonitorStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET environment variable is not configured");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const secretHeader = request.headers.get("x-cron-secret");
  const providedSecret = authHeader?.replace("Bearer ", "") ?? secretHeader;

  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json(
      { error: "Missing required query parameter: workspaceId" },
      { status: 400 },
    );
  }

  try {
    const summary = await pollWorkspace(workspaceId, {
      fetchWorkspace: async (id: string) => {
        const workspace = await prisma.workspace.findFirst({
          where: {
            id,
            datadogIntegration: { status: "CONNECTED" },
          },
          select: {
            id: true,
            datadogIntegration: {
              select: { apiKey: true, appKey: true, site: true },
            },
            domains: {
              select: {
                systems: {
                  select: {
                    id: true,
                    services: { select: { id: true, slug: true, datadogServiceTag: true } },
                  },
                },
              },
            },
          },
        });

        if (!workspace || !workspace.datadogIntegration) return null;

        return {
          id: workspace.id,
          datadogIntegration: workspace.datadogIntegration,
          domains: workspace.domains,
        };
      },

      decryptKey: decrypt,

      siteToUrl: (enumValue: string) =>
        ENUM_TO_SITE[enumValue] ?? "datadoghq.com",

      updateService: async (
        serviceId: string,
        status: DatadogMonitorStatus,
      ) => {
        await prisma.service.update({
          where: { id: serviceId },
          data: {
            datadogStatus: status,
            datadogStatusUpdatedAt: new Date(),
          },
        });
      },

      updateSystem: async (
        systemId: string,
        status: DatadogMonitorStatus,
      ) => {
        await prisma.system.update({
          where: { id: systemId },
          data: { datadogStatus: status },
        });
      },

      updateIntegrationStatus: async (
        wsId: string,
        status: "INVALID",
      ) => {
        await prisma.datadogIntegration.update({
          where: { workspaceId: wsId },
          data: { status },
        });
      },

      fetchApmServices: fetchApmServiceList,
    });

    try {
      await reconcileIncidents(workspaceId);
    } catch (err) {
      console.error("Incident reconciliation failed:", err);
    }

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("Datadog poll cron failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
