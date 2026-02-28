export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
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

const SEVERITY_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "secondary",
  LOW: "outline",
};

export default async function SystemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

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
      domain: { select: { name: true } },
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

  if (!system) {
    notFound();
  }

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

      {/* System Overview Card */}
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

      {/* Services */}
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
                      <Badge variant="secondary">{service.type}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Databases */}
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

      {/* Integrations */}
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
                      <Badge variant="secondary">
                        {integration.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{integration.targetSystem ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Message Topics */}
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
                      <Badge variant="secondary">{topic.broker}</Badge>
                    </TableCell>
                    <TableCell>{topic.role}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Risks */}
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
                      <Badge
                        variant={SEVERITY_VARIANT[risk.severity] ?? "outline"}
                      >
                        {risk.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{risk.description ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Packages */}
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
                      <Badge variant="secondary">{pkg.scope}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
