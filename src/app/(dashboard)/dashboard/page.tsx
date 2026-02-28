export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Layers,
  Server,
  ArrowRightLeft,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboardMetrics } from "@/modules/dashboard/services/get-dashboard-metrics";
import styles from "@/components/dashboard/Dashboard.module.css";

const SEVERITY_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "secondary",
  LOW: "outline",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  COMPLETED: "default",
  PROCESSING: "secondary",
  PENDING: "outline",
  FAILED: "destructive",
};

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics(
    () => prisma.domain.count(),
    () =>
      prisma.system.findMany({
        select: { id: true, name: true, slug: true, language: true },
      }),
    () =>
      prisma.dependency.findMany({
        select: { sourceId: true, targetId: true, type: true },
      }),
    () =>
      prisma.risk.findMany({
        where: { severity: { in: ["HIGH", "CRITICAL"] } },
        orderBy: { id: "desc" },
        include: { system: { select: { name: true } } },
      }),
    () =>
      prisma.inventoryUpload.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
  );

  const statCards = [
    {
      label: "Domains",
      value: metrics.counts.domains,
      icon: Layers,
      iconColor: "text-primary",
    },
    {
      label: "Systems",
      value: metrics.counts.systems,
      icon: Server,
      iconColor: "text-primary",
    },
    {
      label: "Dependencies",
      value: metrics.counts.dependencies,
      icon: ArrowRightLeft,
      iconColor: "text-primary",
    },
    {
      label: "HIGH + CRITICAL Risks",
      value: metrics.counts.highCriticalRisks,
      icon: AlertTriangle,
      iconColor: "text-destructive",
    },
  ];

  const maxLangCount = metrics.languageDistribution[0]?.count ?? 1;
  const maxDepTypeCount = metrics.dependenciesByType[0]?.count ?? 1;

  return (
    <div className="container mx-auto max-w-7xl space-y-8 py-8 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your systems landscape
          </p>
        </div>
        <Link
          href="/graph"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          View Graph
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Metric Cards */}
      <div className={styles.grid}>
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className={styles.statValue}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className={styles.chartSection}>
        <Card>
          <CardHeader>
            <CardTitle>Languages</CardTitle>
            <CardDescription>Distribution across systems</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.languageDistribution.length > 0 ? (
              <div className={styles.barChart}>
                {metrics.languageDistribution.map((item, i) => (
                  <div key={item.language} className={styles.barRow}>
                    <span className={styles.barLabel}>{item.language}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${(item.count / maxLangCount) * 100}%`,
                          backgroundColor:
                            CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                    <span className={styles.barCount}>{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No systems found</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dependency Types</CardTitle>
            <CardDescription>Connections by type</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.dependenciesByType.length > 0 ? (
              <div className={styles.barChart}>
                {metrics.dependenciesByType.map((item, i) => (
                  <div key={item.type} className={styles.barRow}>
                    <span className={styles.barLabel}>
                      {item.type.replace(/_/g, " ")}
                    </span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${(item.count / maxDepTypeCount) * 100}%`,
                          backgroundColor:
                            CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                    <span className={styles.barCount}>{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No dependencies found</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Connected Systems */}
      <Card>
        <CardHeader>
          <CardTitle>Top Connected Systems</CardTitle>
          <CardDescription>
            Systems with the most dependency connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.topConnectedSystems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>System</TableHead>
                  <TableHead className="text-right">Connections</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.topConnectedSystems.map((system) => (
                  <TableRow key={system.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/systems/${system.slug}`}
                        className="hover:underline"
                      >
                        {system.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {system.connectionCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className={styles.emptyState}>No connected systems</div>
          )}
        </CardContent>
      </Card>

      {/* Recent Risks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Risks</CardTitle>
          <CardDescription>Latest HIGH and CRITICAL severity</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.recentRisks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Risk</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.recentRisks.map((risk) => (
                  <TableRow key={risk.id}>
                    <TableCell className="font-medium">{risk.title}</TableCell>
                    <TableCell>{risk.systemName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={SEVERITY_VARIANT[risk.severity] ?? "outline"}
                      >
                        {risk.severity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className={styles.emptyState}>
              No high-severity risks found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
          <CardDescription>Latest inventory uploads</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.recentUploads.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Systems</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.recentUploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell className="font-medium">
                      {upload.filename}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_VARIANT[upload.status] ?? "outline"}
                      >
                        {upload.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {upload.systemsCount}
                    </TableCell>
                    <TableCell>
                      {upload.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className={styles.emptyState}>No uploads yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
