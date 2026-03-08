export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Layers,
  Server,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  Network,
  ExternalLink,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { getDashboardMetrics } from "@/modules/dashboard/services/get-dashboard-metrics";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

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

const BAR_COLORS = [
  "#6366f1",
  "#10b981",
  "#0ea5e9",
  "#f43f5e",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
];

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-24 items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const ctx = await requireWorkspaceAccess(workspaceSlug);

  const metrics = await getDashboardMetrics(
    () =>
      prisma.domain.count({ where: { workspaceId: ctx.workspaceId } }),
    () =>
      prisma.system.findMany({
        where: { domain: { workspaceId: ctx.workspaceId } },
        select: { id: true, name: true, slug: true, language: true },
      }),
    () =>
      prisma.dependency.findMany({
        where: { source: { domain: { workspaceId: ctx.workspaceId } } },
        select: { sourceId: true, targetId: true, type: true },
      }),
    () =>
      prisma.risk.findMany({
        where: {
          severity: { in: ["HIGH", "CRITICAL"] },
          system: { domain: { workspaceId: ctx.workspaceId } },
        },
        orderBy: { id: "desc" },
        take: 5,
        include: { system: { select: { name: true } } },
      }),
    () =>
      prisma.inventoryUpload.findMany({
        where: { workspaceId: ctx.workspaceId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
  );

  const statCards = [
    {
      label: "Domains",
      value: metrics.counts.domains,
      icon: Layers,
      iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      borderHover: "hover:border-indigo-500/30 dark:hover:border-indigo-500/40",
    },
    {
      label: "Active Systems",
      value: metrics.counts.systems,
      icon: Server,
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderHover: "hover:border-emerald-500/30 dark:hover:border-emerald-500/40",
    },
    {
      label: "Dependencies",
      value: metrics.counts.dependencies,
      icon: Network,
      iconBg: "bg-sky-500/10 dark:bg-sky-500/20",
      iconColor: "text-sky-600 dark:text-sky-400",
      borderHover: "hover:border-sky-500/30 dark:hover:border-sky-500/40",
    },
    {
      label: "Critical Risks",
      value: metrics.counts.highCriticalRisks,
      icon: ShieldAlert,
      iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
      iconColor: "text-rose-600 dark:text-rose-500",
      borderHover: "hover:border-rose-500/30 dark:hover:border-rose-500/40",
    },
  ];

  const maxLangCount = metrics.languageDistribution[0]?.count ?? 1;
  const maxDepTypeCount = metrics.dependenciesByType[0]?.count ?? 1;

  return (
    <div className="container mx-auto max-w-7xl space-y-8 py-8 px-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your systems landscape
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300",
              stat.borderHover,
            )}
          >
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  stat.iconBg,
                )}
              >
                <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground/40 group-hover:text-emerald-500 transition-colors" />
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {stat.value}
              </p>
            </div>
            {/* Decorative glow */}
            <div className="pointer-events-none absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-all dark:bg-indigo-500/[0.03] dark:group-hover:bg-indigo-500/[0.07]" />
          </div>
        ))}
      </div>

      {/* Main Content: 2/3 + 1/3 split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Systems & Health Table */}
          <Card className="overflow-hidden rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-indigo-500" />
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">
                    Critical Systems & Health
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Top connected systems by dependency count
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="xs" asChild>
                <Link href={`/w/${workspaceSlug}/systems`}>
                  View all
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {metrics.topConnectedSystems.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">
                          System
                        </TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">
                          Status
                        </TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right">
                          Connections
                        </TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.topConnectedSystems.map((system) => (
                        <TableRow
                          key={system.id}
                          className="group/row"
                        >
                          <TableCell>
                            <Link
                              href={`/w/${workspaceSlug}/systems/${system.slug}`}
                              className="text-sm font-semibold group-hover/row:text-indigo-600 dark:group-hover/row:text-indigo-400 transition-colors"
                            >
                              {system.name}
                            </Link>
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              {system.connectionCount} dependencies
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                              <div className="h-1.5 w-1.5 rounded-full bg-current" />
                              Active
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm font-mono text-muted-foreground">
                            {system.connectionCount}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              asChild
                            >
                              <Link
                                href={`/w/${workspaceSlug}/systems/${system.slug}`}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState message="No connected systems" />
              )}
            </CardContent>
          </Card>

          {/* Stack Distribution */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">
                Stack Distribution
              </CardTitle>
              <CardDescription className="text-xs">
                Language and dependency type distribution across systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.languageDistribution.length > 0 ? (
                <div className="space-y-4">
                  {metrics.languageDistribution.map((item, i) => (
                    <div key={item.language} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.language}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {item.count}{" "}
                          {item.count === 1 ? "system" : "systems"}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(item.count / maxLangCount) * 100}%`,
                            backgroundColor:
                              BAR_COLORS[i % BAR_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No systems found" />
              )}

              {metrics.dependenciesByType.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Dependency Types
                    </h4>
                  </div>
                  <div className="space-y-4">
                    {metrics.dependenciesByType.map((item, i) => (
                      <div key={item.type} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            {item.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {item.count}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(item.count / maxDepTypeCount) * 100}%`,
                              backgroundColor:
                                BAR_COLORS[
                                  (i + metrics.languageDistribution.length) %
                                    BAR_COLORS.length
                                ],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Security Risks Panel */}
          <Card className="overflow-hidden rounded-2xl border-rose-500/10 dark:border-rose-500/20">
            <CardHeader className="flex flex-row items-center justify-between border-b border-rose-500/10 dark:border-rose-500/10">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-500" />
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
                  Security Risks
                </CardTitle>
              </div>
              {metrics.counts.highCriticalRisks > 0 && (
                <Badge
                  variant="destructive"
                  className="rounded-full px-2.5 text-[10px] font-bold"
                >
                  {metrics.counts.highCriticalRisks} Actions
                </Badge>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              {metrics.recentRisks.length > 0 ? (
                <div className="space-y-1">
                  {metrics.recentRisks.map((risk) => (
                    <div
                      key={risk.id}
                      className="group/risk rounded-xl p-3 hover:bg-accent/50 transition-colors cursor-default"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-xs font-semibold leading-snug group-hover/risk:text-foreground">
                          {risk.title}
                        </p>
                        <AlertTriangle
                          className={cn(
                            "mt-0.5 h-3.5 w-3.5 shrink-0",
                            risk.severity === "CRITICAL"
                              ? "text-rose-500"
                              : "text-amber-500",
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="bg-muted px-1.5 py-0.5 rounded border text-[10px]">
                          {risk.systemName}
                        </span>
                        <span>&bull;</span>
                        <span>
                          Priority{" "}
                          {risk.severity.charAt(0) +
                            risk.severity.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No high-severity risks found" />
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Timeline */}
          <Card className="rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-xs font-bold uppercase tracking-widest">
                  Recent Activity
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Latest inventory uploads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.recentUploads.length > 0 ? (
                <div className="relative space-y-6">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />

                  {metrics.recentUploads.map((upload) => (
                    <div key={upload.id} className="relative pl-7">
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          "absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-card",
                          upload.status === "COMPLETED"
                            ? "bg-emerald-500"
                            : upload.status === "FAILED"
                              ? "bg-rose-500"
                              : upload.status === "PROCESSING"
                                ? "bg-amber-500"
                                : "bg-muted-foreground",
                        )}
                      />
                      <p className="text-[11px] font-semibold leading-snug truncate">
                        {upload.filename}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Badge
                          variant={
                            STATUS_VARIANT[upload.status] ?? "outline"
                          }
                          className="text-[9px] px-1.5 py-0"
                        >
                          {upload.status}
                        </Badge>
                        <span>{upload.systemsCount} systems</span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {timeAgo(upload.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No uploads yet" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
