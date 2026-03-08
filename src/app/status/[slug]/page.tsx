export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  fromDatadogStatus,
  worstStatus,
  type HealthStatus,
} from "@/modules/status-page/health";
import { StatusPageClient } from "@/components/status-page/StatusPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = await prisma.statusPageConfig.findUnique({
    where: { slug },
    select: {
      pageTitle: true,
      faviconUrl: true,
      workspace: { select: { name: true } },
    },
  });

  if (!config) return {};

  const title = config.pageTitle || `${config.workspace.name} Status`;
  const description = `Current operational status for ${config.pageTitle || config.workspace.name}`;

  return {
    title,
    description,
    icons: config.faviconUrl ? { icon: config.faviconUrl } : undefined,
    openGraph: { title, description },
  };
}

export interface StatusOverrideData {
  status: "investigating" | "identified" | "monitoring";
  message: string | null;
}

export interface StatusFeature {
  id: string;
  publicName: string;
  status: HealthStatus;
  override?: StatusOverrideData;
}

export interface StatusProduct {
  id: string;
  publicName: string;
  status: HealthStatus;
  features: StatusFeature[];
  override?: StatusOverrideData;
}

export interface StatusPageData {
  workspaceName: string;
  overall: HealthStatus;
  products: StatusProduct[];
  lastUpdated: string;
  whiteLabel: {
    logoUrl: string | null;
    primaryColor: string | null;
    pageTitle: string | null;
    hidePoweredBy: boolean;
  };
  incidentHistory: IncidentGroup[];
}

export interface IncidentItem {
  id: string;
  publicName: string;
  status: "degraded" | "outage";
  startedAt: string;
  resolvedAt: string | null;
  durationMinutes: number | null;
}

export interface IncidentGroup {
  label: string;
  incidents: IncidentItem[];
}

export default async function PublicStatusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const config = await prisma.statusPageConfig.findUnique({
    where: { slug },
    include: {
      workspace: { select: { name: true } },
      products: {
        where: { visible: true },
        orderBy: { displayOrder: "asc" },
        include: {
          features: {
            where: { visible: true },
            orderBy: { displayOrder: "asc" },
            include: {
              feature: {
                include: {
                  systems: {
                    include: {
                      system: {
                        select: { datadogStatus: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!config || !config.enabled) {
    notFound();
  }

  // Fetch active (non-resolved, non-expired) overrides
  const activeOverrides = await prisma.statusOverride.findMany({
    where: {
      workspaceId: config.workspaceId,
      status: { not: "RESOLVED" },
      expiresAt: { gt: new Date() },
    },
  });

  function overrideToHealth(
    status: "investigating" | "identified" | "monitoring",
  ): HealthStatus {
    return status === "monitoring" ? "partial_outage" : "major_outage";
  }

  function mapOverrideStatus(
    dbStatus: string,
  ): "investigating" | "identified" | "monitoring" {
    switch (dbStatus) {
      case "INVESTIGATING":
        return "investigating";
      case "IDENTIFIED":
        return "identified";
      default:
        return "monitoring";
    }
  }

  const products: StatusProduct[] = config.products.map((sp) => {
    const features: StatusFeature[] = sp.features.map((sf) => {
      const systemStatuses = sf.feature.systems
        .map((fs) => fromDatadogStatus(fs.system.datadogStatus))
        .filter((s): s is HealthStatus => s !== null);

      let featureStatus: HealthStatus =
        systemStatuses.length > 0 ? worstStatus(systemStatuses) : "operational";

      const featureOverride = activeOverrides.find(
        (o) => o.targetType === "feature" && o.targetId === sf.featureId,
      );

      let override: StatusOverrideData | undefined;
      if (featureOverride) {
        const mappedStatus = mapOverrideStatus(featureOverride.status);
        override = { status: mappedStatus, message: featureOverride.message };
        const overrideHealth = overrideToHealth(mappedStatus);
        featureStatus = worstStatus([featureStatus, overrideHealth]);
      }

      return {
        id: sf.featureId,
        publicName: sf.publicName,
        status: featureStatus,
        ...(override && { override }),
      };
    });

    const featureStatuses = features.map((f) => f.status);
    let productStatus: HealthStatus =
      featureStatuses.length > 0 ? worstStatus(featureStatuses) : "operational";

    const productOverride = activeOverrides.find(
      (o) => o.targetType === "product" && o.targetId === sp.productId,
    );

    let prodOverride: StatusOverrideData | undefined;
    if (productOverride) {
      const mappedStatus = mapOverrideStatus(productOverride.status);
      prodOverride = {
        status: mappedStatus,
        message: productOverride.message,
      };
      const overrideHealth = overrideToHealth(mappedStatus);
      productStatus = worstStatus([productStatus, overrideHealth]);
    }

    return {
      id: sp.productId,
      publicName: sp.publicName,
      status: productStatus,
      features,
      ...(prodOverride && { override: prodOverride }),
    };
  });

  const productStatuses = products.map((p) => p.status);
  const overall =
    productStatuses.length > 0 ? worstStatus(productStatuses) : "operational";

  // Fetch incidents for the past 90 days
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const incidents = await prisma.incident.findMany({
    where: {
      workspaceId: config.workspaceId,
      startedAt: { gte: ninetyDaysAgo },
    },
    orderBy: { startedAt: "desc" },
  });

  const incidentHistory: IncidentGroup[] = [];
  const monthMap = new Map<string, IncidentItem[]>();

  for (const inc of incidents) {
    const date = new Date(inc.startedAt);
    const label = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
    if (!monthMap.has(label)) monthMap.set(label, []);
    monthMap.get(label)!.push({
      id: inc.id,
      publicName: inc.publicName,
      status: inc.status === "DEGRADED" ? "degraded" : "outage",
      startedAt: inc.startedAt.toISOString(),
      resolvedAt: inc.resolvedAt?.toISOString() ?? null,
      durationMinutes: inc.durationMinutes,
    });
  }

  for (const [label, items] of monthMap) {
    incidentHistory.push({ label, incidents: items });
  }

  const data: StatusPageData = {
    workspaceName: config.workspace.name,
    overall,
    products,
    lastUpdated: new Date().toISOString(),
    whiteLabel: {
      logoUrl: config.logoUrl,
      primaryColor: config.primaryColor,
      pageTitle: config.pageTitle,
      hidePoweredBy: config.hidePoweredBy,
    },
    incidentHistory,
  };

  return <StatusPageClient data={data} />;
}
