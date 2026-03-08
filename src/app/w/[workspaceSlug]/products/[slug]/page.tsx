export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { ENUM_TO_SITE } from "@/modules/workspace/validators/datadog-integration-schema";
import { Badge } from "@/components/ui/badge";
import { DatadogStatusBadge } from "@/components/shared/DatadogStatusBadge";
import type { ProductTier } from "@/modules/product/types";
import { ProductDetailActions } from "./ProductDetailActions";
import { ProductHealthCard } from "@/components/products/ProductHealthCard";
import { FeaturesCard } from "@/components/products/FeaturesCard";

const TIER_VARIANT: Record<ProductTier, "destructive" | "default" | "secondary" | "outline"> = {
  CRITICAL: "destructive",
  HIGH: "default",
  MEDIUM: "secondary",
  LOW: "outline",
};

const STATUS_SEVERITY: Record<string, number> = {
  OK: 0,
  NO_DATA: 1,
  WARN: 2,
  ALERT: 3,
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; slug: string }>;
}) {
  const { workspaceSlug, slug } = await params;
  const ctx = await requireWorkspaceAccess(workspaceSlug);

  const product = await prisma.product.findUnique({
    where: {
      workspaceId_slug: {
        workspaceId: ctx.workspaceId,
        slug,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      tier: true,
      createdAt: true,
      updatedAt: true,
      systems: {
        select: {
          system: {
            select: {
              id: true,
              name: true,
              slug: true,
              language: true,
              framework: true,
              domain: { select: { name: true } },
              datadogStatus: true,
              services: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  datadogServiceTag: true,
                  datadogStatus: true,
                  datadogStatusUpdatedAt: true,
                  datadogMonitorIds: true,
                },
              },
            },
          },
        },
        orderBy: { system: { name: "asc" } },
      },
      features: {
        select: {
          id: true,
          name: true,
          description: true,
          systems: {
            select: {
              system: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const systems = product.systems.map((ps) => ps.system);
  const features = product.features.map((f) => ({
    ...f,
    systems: f.systems.map((fs) => fs.system),
  }));
  const tier = product.tier as ProductTier;

  // Fetch all workspace systems for the edit dialog
  const allSystems = await prisma.system.findMany({
    where: { domain: { workspaceId: ctx.workspaceId } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // Fetch Datadog integration status
  const datadogIntegration = await prisma.datadogIntegration.findUnique({
    where: { workspaceId: ctx.workspaceId },
    select: { site: true, status: true },
  });

  const ddConnected = datadogIntegration?.status === "CONNECTED";
  const siteHost = datadogIntegration
    ? ENUM_TO_SITE[datadogIntegration.site] ?? "datadoghq.com"
    : null;

  // Derive health metrics
  const allServices = systems.flatMap((s) => s.services);
  const monitoredServices = allServices.filter(
    (s) => s.datadogStatus && s.datadogStatus !== "NOT_FOUND",
  );

  const overallHealth =
    monitoredServices.length === 0
      ? null
      : monitoredServices.reduce<string>((worst, s) => {
          const sev = STATUS_SEVERITY[s.datadogStatus!] ?? -1;
          return sev > (STATUS_SEVERITY[worst] ?? -1) ? s.datadogStatus! : worst;
        }, "OK");

  const healthySystems = systems.filter((sys) => {
    const monitored = sys.services.filter(
      (s) => s.datadogStatus && s.datadogStatus !== "NOT_FOUND",
    );
    return monitored.length > 0 && monitored.every((s) => s.datadogStatus === "OK");
  }).length;

  const notMonitoredCount = allServices.filter(
    (s) => s.datadogStatus === "NOT_FOUND",
  ).length;

  const alertSystemIds = systems
    .filter((sys) => sys.services.some((s) => s.datadogStatus === "ALERT"))
    .map((sys) => sys.id);

  const productDetail = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    tier,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    systems,
    features,
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-8 py-8 px-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {product.name}
            </h1>
            <Badge variant={TIER_VARIANT[tier]}>{tier}</Badge>
            {ddConnected && overallHealth && (
              <DatadogStatusBadge status={overallHealth} />
            )}
          </div>
          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}
        </div>
        <ProductDetailActions
          workspaceSlug={workspaceSlug}
          product={productDetail}
          allSystems={allSystems}
          userRole={ctx.role}
        />
      </div>

      <ProductHealthCard
        workspaceSlug={workspaceSlug}
        systems={systems}
        ddConnected={ddConnected}
        siteHost={siteHost}
        healthySystems={healthySystems}
        notMonitoredCount={notMonitoredCount}
      />

      <FeaturesCard
        workspaceSlug={workspaceSlug}
        productId={product.id}
        features={features}
        allSystems={allSystems}
        canEdit={ctx.role === "OWNER" || ctx.role === "EDITOR"}
        alertSystemIds={alertSystemIds}
      />
    </div>
  );
}
