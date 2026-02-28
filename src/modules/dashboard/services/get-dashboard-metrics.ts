import type { DashboardMetrics } from "../types";

interface SystemRow {
  id: string;
  name: string;
  slug: string;
  language: string | null;
}

interface DependencyRow {
  sourceId: string;
  targetId: string;
  type: string;
}

interface RiskRow {
  id: string;
  title: string;
  severity: string;
  system: { name: string };
}

interface UploadRow {
  id: string;
  filename: string;
  status: string;
  systemsCount: number;
  createdAt: Date;
}

export async function getDashboardMetrics(
  getDomainCount: () => Promise<number>,
  getAllSystems: () => Promise<SystemRow[]>,
  getAllDependencies: () => Promise<DependencyRow[]>,
  getHighCriticalRisks: () => Promise<RiskRow[]>,
  getRecentUploads: () => Promise<UploadRow[]>,
): Promise<DashboardMetrics> {
  const [domainCount, systems, dependencies, risks, uploads] =
    await Promise.all([
      getDomainCount(),
      getAllSystems(),
      getAllDependencies(),
      getHighCriticalRisks(),
      getRecentUploads(),
    ]);

  // Language distribution: group by language, count each, sort descending
  const langMap = new Map<string, number>();
  for (const system of systems) {
    const lang = system.language ?? "Unknown";
    langMap.set(lang, (langMap.get(lang) ?? 0) + 1);
  }
  const languageDistribution = [...langMap.entries()]
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count);

  // Dependencies by type: group by type, count each, sort descending
  const typeMap = new Map<string, number>();
  for (const dep of dependencies) {
    typeMap.set(dep.type, (typeMap.get(dep.type) ?? 0) + 1);
  }
  const dependenciesByType = [...typeMap.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Top connected systems: count inbound + outbound for each system, top 5
  const connectionMap = new Map<string, number>();
  for (const dep of dependencies) {
    connectionMap.set(
      dep.sourceId,
      (connectionMap.get(dep.sourceId) ?? 0) + 1,
    );
    connectionMap.set(
      dep.targetId,
      (connectionMap.get(dep.targetId) ?? 0) + 1,
    );
  }

  const systemLookup = new Map(systems.map((s) => [s.id, s]));
  const topConnectedSystems = [...connectionMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .flatMap(([id, connectionCount]) => {
      const system = systemLookup.get(id);
      if (!system) return [];
      return [
        {
          id: system.id,
          name: system.name,
          slug: system.slug,
          connectionCount,
        },
      ];
    });

  // Recent risks (already filtered to HIGH/CRITICAL by the getter, take top 5)
  const recentRisks = risks.slice(0, 5).map((r) => ({
    id: r.id,
    title: r.title,
    severity: r.severity,
    systemName: r.system.name,
  }));

  // Recent uploads (already sorted by the getter, take top 5)
  const recentUploads = uploads.slice(0, 5).map((u) => ({
    id: u.id,
    filename: u.filename,
    status: u.status,
    systemsCount: u.systemsCount,
    createdAt: u.createdAt,
  }));

  return {
    counts: {
      domains: domainCount,
      systems: systems.length,
      dependencies: dependencies.length,
      highCriticalRisks: risks.length,
    },
    languageDistribution,
    dependenciesByType,
    topConnectedSystems,
    recentRisks,
    recentUploads,
  };
}
