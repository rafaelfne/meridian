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
  productDailyStatus: Record<string, HealthStatus[]>;
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

  const products: StatusProduct[] = config.products.map((sp) => {
    const features: StatusFeature[] = sp.features.map((sf) => {
      const systemStatuses = sf.feature.systems
        .map((fs) => fromDatadogStatus(fs.system.datadogStatus))
        .filter((s): s is HealthStatus => s !== null);

      return {
        id: sf.featureId,
        publicName: sf.publicName,
        status: systemStatuses.length > 0 ? worstStatus(systemStatuses) : "operational",
      };
    });

    const featureStatuses = features.map((f) => f.status);

    return {
      id: sp.productId,
      publicName: sp.publicName,
      status: featureStatuses.length > 0 ? worstStatus(featureStatuses) : "operational",
      features,
    };
  });

  const productStatuses = products.map((p) => p.status);
  const overall =
    productStatuses.length > 0 ? worstStatus(productStatuses) : "operational";

  // Fetch incidents and active overrides for the past 90 days
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const [incidents, activeOverrides] = await Promise.all([
    prisma.incident.findMany({
      where: {
        workspaceId: config.workspaceId,
        startedAt: { gte: ninetyDaysAgo },
      },
      orderBy: { startedAt: "desc" },
    }),
    prisma.statusOverride.findMany({
      where: {
        workspaceId: config.workspaceId,
        status: { not: "RESOLVED" },
        expiresAt: { gt: now },
      },
    }),
  ]);

  // Build override lookup by targetId
  const overrideMap = new Map<string, StatusOverrideData>();
  for (const o of activeOverrides) {
    overrideMap.set(o.targetId, {
      status: o.status.toLowerCase() as StatusOverrideData["status"],
      message: o.message,
    });
  }

  // Attach overrides to products and features
  for (const product of products) {
    const productOverride = overrideMap.get(product.id);
    if (productOverride) product.override = productOverride;
    for (const feature of product.features) {
      const featureOverride = overrideMap.get(feature.id);
      if (featureOverride) feature.override = featureOverride;
    }
  }

  // Compute daily status per product over the last 90 days
  const productDailyStatus: Record<string, HealthStatus[]> = {};
  const productIds = new Set(products.map((p) => p.id));
  for (const pid of productIds) {
    const days: HealthStatus[] = [];
    for (let i = 89; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayIncidents = incidents.filter(
        (inc) =>
          inc.affectedProductId === pid &&
          inc.startedAt < dayEnd &&
          (inc.resolvedAt === null || inc.resolvedAt > dayStart),
      );

      if (dayIncidents.length === 0) {
        days.push("operational");
      } else {
        const hasOutage = dayIncidents.some((inc) => inc.status === "OUTAGE");
        days.push(hasOutage ? "major_outage" : "partial_outage");
      }
    }
    productDailyStatus[pid] = days;
  }

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
    productDailyStatus,
    lastUpdated: now.toISOString(),
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
