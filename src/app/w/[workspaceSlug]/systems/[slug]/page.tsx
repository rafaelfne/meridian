export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ExternalLink, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
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
        select: { id: true, name: true, type: true },
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

  const canEdit = ctx.role === "EDITOR" || ctx.role === "OWNER";

  return (
    <div className="container mx-auto max-w-7xl space-y-8 py-8 px-4">
      <div>
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

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Language
              </dt>
              <dd className="text-sm">{system.language ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Framework
              </dt>
              <dd className="text-sm">
                {system.framework
                  ? `${system.framework}${system.frameworkVersion ? ` ${system.frameworkVersion}` : ""}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Domain
              </dt>
              <dd className="text-sm">{system.domain.name}</dd>
            </div>
            {system.repositoryUrl && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Repository
                </dt>
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

      {system.services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>
              {system.services.length} service(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {system.services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      {service.name}
                    </TableCell>
                    <TableCell>
                      <TagBadge category="service-type" value={service.type} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {system.databases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Databases</CardTitle>
            <CardDescription>
              {system.databases.length} database(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {system.integrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>
              {system.integrations.length} integration(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    <TableCell className="font-medium">
                      {integration.name}
                    </TableCell>
                    <TableCell>
                      <TagBadge category="integration-type" value={integration.type} />
                    </TableCell>
                    <TableCell>{integration.targetSystem ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {system.messageTopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Message Topics</CardTitle>
            <CardDescription>
              {system.messageTopics.length} topic(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {system.risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risks</CardTitle>
            <CardDescription>{system.risks.length} risk(s)</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {system.packages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Packages</CardTitle>
            <CardDescription>Top packages used</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Documentation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>
                {documents.length} document(s)
              </CardDescription>
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
    </div>
  );
}
