"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
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
import { DatadogStatusBadge } from "@/components/shared/DatadogStatusBadge";
import { timeAgo } from "@/lib/time";

interface ServiceData {
  id: string;
  name: string;
  slug: string;
  datadogServiceTag: string | null;
  datadogStatus: string | null;
  datadogStatusUpdatedAt: Date | string | null;
  datadogMonitorIds: unknown;
}

interface SystemData {
  id: string;
  name: string;
  slug: string;
  language: string | null;
  framework: string | null;
  domain: { name: string };
  datadogStatus: string | null;
  services: ServiceData[];
}

interface ProductHealthCardProps {
  workspaceSlug: string;
  systems: SystemData[];
  ddConnected: boolean;
  siteHost: string | null;
  healthySystems: number;
  notMonitoredCount: number;
}

export function ProductHealthCard({
  workspaceSlug,
  systems,
  ddConnected,
  siteHost,
  healthySystems,
  notMonitoredCount,
}: ProductHealthCardProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleSystem(systemId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(systemId)) {
        next.delete(systemId);
      } else {
        next.add(systemId);
      }
      return next;
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked Systems ({systems.length})</CardTitle>
        {ddConnected && systems.length > 0 && (
          <CardDescription>
            {healthySystems} of {systems.length} systems healthy
            {notMonitoredCount > 0 && (
              <span className="text-yellow-600">
                {" "}· {notMonitoredCount} service{notMonitoredCount !== 1 ? "s" : ""} not monitored in Datadog
              </span>
            )}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {systems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No systems linked to this product yet.
          </p>
        ) : !ddConnected ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead className="hidden sm:table-cell">Language</TableHead>
                  <TableHead className="hidden sm:table-cell">Framework</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systems.map((system) => (
                  <TableRow key={system.id}>
                    <TableCell>
                      <Link
                        href={`/w/${workspaceSlug}/systems/${system.slug}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {system.name}
                      </Link>
                    </TableCell>
                    <TableCell>{system.domain.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {system.language ?? "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {system.framework ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-4 text-sm text-muted-foreground">
              Connect Datadog in workspace settings to monitor service health.
            </p>
          </>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systems.map((system) => {
                  const isExpanded = expanded.has(system.id);
                  const hasServices = system.services.length > 0;

                  return (
                    <Fragment key={system.id}>
                      <TableRow
                        className={hasServices ? "cursor-pointer" : ""}
                        onClick={() => hasServices && toggleSystem(system.id)}
                      >
                        <TableCell className="w-8 pr-0">
                          {hasServices &&
                            (isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            ))}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/w/${workspaceSlug}/systems/${system.slug}`}
                            className="font-medium text-foreground hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {system.name}
                          </Link>
                        </TableCell>
                        <TableCell>{system.domain.name}</TableCell>
                        <TableCell>
                          <DatadogStatusBadge status={system.datadogStatus} />
                        </TableCell>
                      </TableRow>

                      {isExpanded &&
                        system.services.map((service) => {
                          const tag = service.datadogServiceTag ?? service.slug;
                          const monitorIds = Array.isArray(service.datadogMonitorIds)
                            ? service.datadogMonitorIds
                            : [];
                          const isNotFound = service.datadogStatus === "NOT_FOUND";
                          const ddUrl = siteHost
                            ? `https://app.${siteHost}/apm/services?query=service%3A${encodeURIComponent(tag)}`
                            : null;

                          return (
                            <TableRow
                              key={service.id}
                              className="bg-muted/30"
                            >
                              <TableCell />
                              <TableCell className="font-mono text-xs">
                                {tag}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {monitorIds.length > 0
                                  ? `${monitorIds.length} monitor${monitorIds.length !== 1 ? "s" : ""}`
                                  : service.datadogStatusUpdatedAt
                                    ? `Updated ${timeAgo(new Date(service.datadogStatusUpdatedAt))}`
                                    : "—"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 justify-between">
                                  <DatadogStatusBadge status={service.datadogStatus} />
                                  {ddUrl && (
                                    <a
                                      href={ddUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs whitespace-nowrap hover:underline text-muted-foreground"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {isNotFound ? "Search in Datadog →" : "View"}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
