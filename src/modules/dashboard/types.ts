export interface DashboardMetrics {
  counts: {
    domains: number;
    systems: number;
    dependencies: number;
    highCriticalRisks: number;
  };
  languageDistribution: { language: string; count: number }[];
  dependenciesByType: { type: string; count: number }[];
  topConnectedSystems: {
    id: string;
    name: string;
    slug: string;
    connectionCount: number;
  }[];
  recentRisks: {
    id: string;
    title: string;
    severity: string;
    systemName: string;
  }[];
  recentUploads: {
    id: string;
    filename: string;
    status: string;
    systemsCount: number;
    createdAt: Date;
  }[];
}
