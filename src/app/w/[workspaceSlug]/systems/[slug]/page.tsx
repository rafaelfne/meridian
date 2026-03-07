export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ExternalLink, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { ENUM_TO_SITE } from "@/modules/workspace/validators/datadog-integration-schema";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "@/components/shared/TagBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SystemDetailTabs, type SystemTab } from "@/components/systems/SystemDetailTabs";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function DatadogStatusBadge({ status }: { status: string | null }) {
  switch (status) {
    case "OK":
      return <Badge variant="outline" className="text-green-600 border-green-400">OK</Badge>;
    case "WARN":
      return <Badge variant="outline" className="text-yellow-600 border-yellow-400">Warn</Badge>;
    case "ALERT":
      return <Badge variant="destructive">Alert</Badge>;
    case "NO_DATA":
      return <Badge variant="secondary">No Data</Badge>;
    case "NOT_FOUND":
      return <Badge variant="outline" className="text-yellow-600 border-yellow-400">Not monitored</Badge>;
    default:
      return <span className="text-sm text-muted-foreground">—</span>;
  }
}



export default async function SystemDetailPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; slug: string }>;
}) {
  const { workspaceSlug, slug } = await params;
  const ctx = await requireWorkspaceAccess(workspaceSlug);

  const system = await prisma.system.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      purpose: true,
      language: true,
      framework: true,
      frameworkVersion: true,
      repositoryUrl: true,
      domain: { select: { name: true, workspaceId: true } },
      services: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          datadogServiceTag: true,
          datadogStatus: true,
          datadogStatusUpdatedAt: true,
          datadogMonitorIds: true,
        },
      },
      databases: {
        select: {
          id: true,
          name: true,
          provider: true,
          version: true,
          orm: true,
        },
      },
      integrations: {
        select: {
          id: true,
          name: true,
          type: true,
          targetSystem: true,
          url: true,
        },
      },
      messageTopics: {
        select: { id: true, name: true, role: true, broker: true },
      },
      packages: {
        select: { id: true, name: true, version: true, scope: true },
        take: 20,
      },
      risks: {
        select: {
          id: true,
          title: true,
          description: true,
          severity: true,
        },
      },
    },
  });

  if (!system || system.domain.workspaceId !== ctx.workspaceId) {
    notFound();
  }

  const documents = await prisma.document.findMany({
    where: { systemId: system.id },
    select: {
      id: true,
      title: true,
      slug: true,
      updatedAt: true,
      author: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const datadogIntegration = await prisma.datadogIntegration.findUnique({
    where: { workspaceId: ctx.workspaceId },
    select: { site: true, status: true },
  });

  const canEdit = ctx.role === "EDITOR" || ctx.role === "OWNER";

  /* ── Tab: Overview ─────────────────────────────────────────── */
  const overviewTab = (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Language</dt>
            <dd className="text-sm">{system.language ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Framework</dt>
            <dd className="text-sm">
              {system.framework
                ? `${system.framework}${system.frameworkVersion ? ` ${system.frameworkVersion}` : ""}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Domain</dt>
            <dd className="text-sm">{system.domain.name}</dd>
          </div>
          {system.repositoryUrl && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Repository</dt>
              <dd className="text-sm">
                <a
                  href={system.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  View <ExternalLink className="h-3 w-3" />
                </a>
              </dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );

  /* ── Tab: Architecture ─────────────────────────────────────── */
  const archSections: React.ReactNode[] = [];

  if (system.services.length > 0) {
    const monitored = system.services.filter(
      (s) => s.datadogStatus && s.datadogStatus !== "NOT_FOUND",
    ).length;
    const total = system.services.length;
    const hasAnyStatus = system.services.some((s) => s.datadogStatus != null);

    archSections.push(
      <Card key="services">
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>
            {system.services.length} service(s)
            {hasAnyStatus && (
              <span className="ml-2">
                — {monitored} of {total} monitored in Datadog
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                {hasAnyStatus && <TableHead>Datadog</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {system.services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    <TagBadge category="service-type" value={service.type} />
                  </TableCell>
                  {hasAnyStatus && (
                    <TableCell>
                      <DatadogStatusBadge status={service.datadogStatus} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>,
    );
  }

  if (system.databases.length > 0) {
    archSections.push(
      <Card key="databases">
        <CardHeader>
          <CardTitle>Databases</CardTitle>
          <CardDescription>{system.databases.length} database(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>ORM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {system.databases.map((db) => (
                <TableRow key={db.id}>
                  <TableCell className="font-medium">{db.name}</TableCell>
                  <TableCell>{db.provider}</TableCell>
                  <TableCell>{db.version ?? "—"}</TableCell>
                  <TableCell>{db.orm ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>,
    );
  }

  if (system.integrations.length > 0) {
    archSections.push(
      <Card key="integrations">
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>{system.integrations.length} integration(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {system.integrations.map((integration) => (
                <TableRow key={integration.id}>
                  <TableCell className="font-medium">{integration.name}</TableCell>
                  <TableCell>
                    <TagBadge category="integration-type" value={integration.type} />
                  </TableCell>
                  <TableCell>{integration.targetSystem ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>,
    );
  }

  if (system.messageTopics.length > 0) {
    archSections.push(
      <Card key="topics">
        <CardHeader>
          <CardTitle>Message Topics</CardTitle>
          <CardDescription>{system.messageTopics.length} topic(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Broker</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {system.messageTopics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell className="font-medium">{topic.name}</TableCell>
                  <TableCell>
                    <TagBadge category="broker" value={topic.broker} />
                  </TableCell>
                  <TableCell>
                    <TagBadge category="topic-role" value={topic.role} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>,
    );
  }

  if (system.packages.length > 0) {
    archSections.push(
      <Card key="packages">
        <CardHeader>
          <CardTitle>Packages</CardTitle>
          <CardDescription>Top packages used</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Scope</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {system.packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
                  <TableCell>{pkg.version ?? "—"}</TableCell>
                  <TableCell>
                    <TagBadge category="package-scope" value={pkg.scope} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>,
    );
  }

  const architectureContent =
    archSections.length > 0 ? (
      <div className="space-y-6">{archSections}</div>
    ) : null;

  const archItemCount =
    system.services.length +
    system.databases.length +
    system.integrations.length +
    system.messageTopics.length +
    system.packages.length;

  /* ── Tab: Risks ────────────────────────────────────────────── */
  const risksContent =
    system.risks.length > 0 ? (
      <Card>
        <CardHeader>
          <CardTitle>Risks</CardTitle>
          <CardDescription>{system.risks.length} risk(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {system.risks.map((risk) => (
                <TableRow key={risk.id}>
                  <TableCell className="font-medium">{risk.title}</TableCell>
                  <TableCell>
                    <TagBadge category="severity" value={risk.severity} />
                  </TableCell>
                  <TableCell>{risk.description ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    ) : null;

  /* ── Tab: Monitoring ─────────────────────────────────────── */
  const ddConnected = datadogIntegration?.status === "CONNECTED";
  const siteHost = datadogIntegration ? ENUM_TO_SITE[datadogIntegration.site] ?? "datadoghq.com" : null;
  const monitoredCount = system.services.filter(
    (s) => s.datadogStatus && s.datadogStatus !== "NOT_FOUND",
  ).length;

  let monitoringContent: React.ReactNode = null;

  if (system.services.length > 0) {
    if (!ddConnected) {
      monitoringContent = (
        <Card>
          <CardHeader>
            <CardTitle>Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Datadog integration not connected</p>
            <p className="text-sm text-muted-foreground mt-1">
              Connect Datadog in workspace settings to monitor service health.
            </p>
          </CardContent>
        </Card>
      );
    } else {
      monitoringContent = (
        <Card>
          <CardHeader>
            <CardTitle>Monitoring</CardTitle>
            <CardDescription>
              {monitoredCount} of {system.services.length} services monitored
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Monitors</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-[1%]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {system.services.map((service) => {
                    const tag = service.datadogServiceTag ?? service.slug;
                    const ddUrl = `https://app.${siteHost}/apm/services?query=service%3A${encodeURIComponent(tag)}`;
                    const monitorIds = Array.isArray(service.datadogMonitorIds)
                      ? service.datadogMonitorIds
                      : [];
                    const isNotFound = service.datadogStatus === "NOT_FOUND";

                    return (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium font-mono text-xs">
                          {tag}
                        </TableCell>
                        <TableCell>
                          <DatadogStatusBadge status={service.datadogStatus} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {monitorIds.length > 0
                            ? `${monitorIds.length} monitor${monitorIds.length !== 1 ? "s" : ""}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {service.datadogStatusUpdatedAt
                            ? `Updated ${timeAgo(service.datadogStatusUpdatedAt)}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <a
                            href={ddUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm whitespace-nowrap hover:underline"
                          >
                            {isNotFound ? "Search in Datadog →" : "View"}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  /* ── Tab: Documentation ────────────────────────────────────── */
  const docsContent = (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>{documents.length} document(s)</CardDescription>
          </div>
          {canEdit && (
            <Link
              href={`/w/${workspaceSlug}/systems/${slug}/docs/new`}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus size={14} />
              New Document
            </Link>
          )}
        </div>
      </CardHeader>
      {documents.length > 0 && (
        <CardContent>
          <div className="space-y-2">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/w/${workspaceSlug}/systems/${slug}/docs/${doc.slug}`}
                className="flex items-center gap-3 rounded-md p-3 hover:bg-muted transition-colors"
              >
                <FileText size={16} className="text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Updated{" "}
                    {doc.updatedAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {doc.author.name && ` by ${doc.author.name}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );

  /* ── Assemble tabs ─────────────────────────────────────────── */
  const tabs: SystemTab[] = [
    ...(architectureContent
      ? [{ value: "architecture", label: "Architecture", count: archItemCount, content: architectureContent }]
      : []),
    ...(monitoringContent
      ? [{ value: "monitoring", label: "Monitoring", count: monitoredCount, content: monitoringContent }]
      : []),
    ...(risksContent
      ? [{ value: "risks", label: "Risks", count: system.risks.length, content: risksContent }]
      : []),
    { value: "docs", label: "Docs", count: documents.length, content: docsContent },
  ];

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {system.name}
          </h1>
          <Badge variant="outline">{system.domain.name}</Badge>
        </div>
        {system.purpose && (
          <p className="text-muted-foreground">{system.purpose}</p>
        )}
      </div>

      {overviewTab}

      <div className="mt-6">
        <SystemDetailTabs tabs={tabs} />
      </div>
    </div>
  );
}
