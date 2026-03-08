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

export interface StatusFeature {
  id: string;
  publicName: string;
  status: HealthStatus;
}

export interface StatusProduct {
  id: string;
  publicName: string;
  status: HealthStatus;
  features: StatusFeature[];
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
  };

  return <StatusPageClient data={data} />;
}
