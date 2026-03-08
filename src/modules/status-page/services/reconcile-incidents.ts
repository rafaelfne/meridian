import { prisma } from "@/lib/prisma";
import {
  fromDatadogStatus,
  worstStatus,
  type HealthStatus,
} from "@/modules/status-page/health";
import type { IncidentStatus } from "@/generated/prisma/enums";

interface ComputedEntity {
  affectedProductId: string;
  affectedFeatureId: string | null;
  publicName: string;
  healthStatus: HealthStatus;
}

function healthToIncidentStatus(
  health: HealthStatus,
): IncidentStatus | null {
  switch (health) {
    case "partial_outage":
      return "DEGRADED";
    case "major_outage":
      return "OUTAGE";
    default:
      return null;
  }
}

const SEVERITY_RANK: Record<IncidentStatus, number> = {
  DEGRADED: 1,
  OUTAGE: 2,
};

export async function reconcileIncidents(
  workspaceId: string,
): Promise<void> {
  const config = await prisma.statusPageConfig.findUnique({
    where: { workspaceId },
    include: {
      products: {
        where: { visible: true },
        include: {
          product: { select: { id: true } },
          features: {
            where: { visible: true },
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

  if (!config || !config.enabled) return;

  // Compute current health for each visible product/feature
  const entities: ComputedEntity[] = [];

  for (const sp of config.products) {
    const featureStatuses: HealthStatus[] = [];

    for (const sf of sp.features) {
      const systemStatuses = sf.feature.systems
        .map((fs) => fromDatadogStatus(fs.system.datadogStatus))
        .filter((s): s is HealthStatus => s !== null);

      const featureHealth =
        systemStatuses.length > 0 ? worstStatus(systemStatuses) : "operational";

      featureStatuses.push(featureHealth);

      entities.push({
        affectedProductId: sp.productId,
        affectedFeatureId: sf.featureId,
        publicName: sf.publicName,
        healthStatus: featureHealth,
      });
    }

    const productHealth =
      featureStatuses.length > 0
        ? worstStatus(featureStatuses)
        : "operational";

    entities.push({
      affectedProductId: sp.productId,
      affectedFeatureId: null,
      publicName: sp.publicName,
      healthStatus: productHealth,
    });
  }

  // Fetch open incidents
  const openIncidents = await prisma.incident.findMany({
    where: { workspaceId, resolvedAt: null },
  });

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const entity of entities) {
      const incidentStatus = healthToIncidentStatus(entity.healthStatus);
      const match = openIncidents.find(
        (i) =>
          i.affectedProductId === entity.affectedProductId &&
          i.affectedFeatureId === entity.affectedFeatureId,
      );

      if (incidentStatus) {
        if (!match) {
          // Create new incident
          await tx.incident.create({
            data: {
              workspaceId,
              affectedProductId: entity.affectedProductId,
              affectedFeatureId: entity.affectedFeatureId,
              publicName: entity.publicName,
              status: incidentStatus,
              auto: true,
            },
          });
        } else if (
          SEVERITY_RANK[incidentStatus] > SEVERITY_RANK[match.status]
        ) {
          // Escalate severity
          await tx.incident.update({
            where: { id: match.id },
            data: { status: incidentStatus },
          });
        }
      } else if (match) {
        // Resolve: entity is now operational
        const durationMinutes = Math.round(
          (now.getTime() - match.startedAt.getTime()) / 60_000,
        );
        await tx.incident.update({
          where: { id: match.id },
          data: { resolvedAt: now, durationMinutes },
        });
      }
    }

    // Resolve orphaned incidents (entity removed from status page)
    const entityKeys = new Set(
      entities.map(
        (e) => `${e.affectedProductId}|${e.affectedFeatureId ?? ""}`,
      ),
    );
    for (const incident of openIncidents) {
      const key = `${incident.affectedProductId}|${incident.affectedFeatureId ?? ""}`;
      if (!entityKeys.has(key)) {
        const durationMinutes = Math.round(
          (now.getTime() - incident.startedAt.getTime()) / 60_000,
        );
        await tx.incident.update({
          where: { id: incident.id },
          data: { resolvedAt: now, durationMinutes },
        });
      }
    }

    // Cleanup: remove resolved incidents older than 90 days
    const ninetyDaysAgo = new Date(
      Date.now() - 90 * 24 * 60 * 60 * 1000,
    );
    await tx.incident.deleteMany({
      where: {
        workspaceId,
        resolvedAt: { not: null },
        startedAt: { lt: ninetyDaysAgo },
      },
    });
  });
}
