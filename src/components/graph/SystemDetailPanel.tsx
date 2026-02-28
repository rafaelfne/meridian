"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getSystemDetailAction,
  type GetSystemDetailResult,
} from "@/modules/system/actions/get-system-detail";
import type { SystemDetail } from "@/modules/system/types";
import {
  ExternalLink,
  Loader2,
  Server,
  Database,
  Globe,
  Radio,
  Package,
  AlertTriangle,
  Highlighter,
} from "lucide-react";
import clsx from "clsx";
import styles from "./SystemDetailPanel.module.css";

/* ────────────────────────────────────────────────────────── */
/*  Props                                                     */
/* ────────────────────────────────────────────────────────── */

interface SystemDetailPanelProps {
  systemId: string | null;
  onClose: () => void;
  onHighlightDependencies?: (systemId: string) => void;
}

/* ────────────────────────────────────────────────────────── */
/*  Helpers                                                   */
/* ────────────────────────────────────────────────────────── */

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
} as const;

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function SeverityBadge({ severity }: { severity: string }) {
  const severityClass: string | undefined = {
    LOW: styles.severityLow,
    MEDIUM: styles.severityMedium,
    HIGH: styles.severityHigh,
    CRITICAL: styles.severityCritical,
  }[severity];

  return (
    <Badge variant="outline" className={clsx(severityClass)}>
      {severity}
    </Badge>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Component                                                 */
/* ────────────────────────────────────────────────────────── */

export function SystemDetailPanel({
  systemId,
  onClose,
  onHighlightDependencies,
}: SystemDetailPanelProps) {
  const [detail, setDetail] = useState<SystemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Fetch system detail when systemId changes ────────── */
  useEffect(() => {
    if (!systemId) return;

    const id = systemId;
    let cancelled = false;

    async function fetchDetail() {
      setLoading(true);
      setError(null);
      setDetail(null);

      const result: GetSystemDetailResult =
        await getSystemDetailAction(id);

      if (cancelled) return;

      if (result.success && result.data) {
        setDetail(result.data);
      } else {
        setError(result.error ?? "Failed to load system details");
      }

      setLoading(false);
    }

    void fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [systemId]);

  /* ── Sheet open-change handler ────────────────────────── */
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  /* ── Highlight handler ────────────────────────────────── */
  const handleHighlight = useCallback(() => {
    if (systemId && onHighlightDependencies) {
      onHighlightDependencies(systemId);
    }
  }, [systemId, onHighlightDependencies]);

  return (
    <Sheet open={systemId !== null} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex flex-col sm:max-w-md">
        {/* ── Loading state ──────────────────────────────── */}
        {loading && (
          <>
            <SheetHeader>
              <SheetTitle>Loading…</SheetTitle>
              <SheetDescription>Fetching system details</SheetDescription>
            </SheetHeader>
            <div className={styles.loadingState}>
              <Loader2 className="size-6 animate-spin" />
            </div>
          </>
        )}

        {/* ── Error state ────────────────────────────────── */}
        {!loading && error && (
          <>
            <SheetHeader>
              <SheetTitle>Error</SheetTitle>
              <SheetDescription>
                Could not load system details
              </SheetDescription>
            </SheetHeader>
            <div className={styles.errorState}>
              <AlertTriangle className="size-5" />
              <span>{error}</span>
            </div>
          </>
        )}

        {/* ── Detail content ─────────────────────────────── */}
        {!loading && !error && detail && (
          <>
            {/* Header */}
            <SheetHeader className={styles.header}>
              <SheetTitle>{detail.name}</SheetTitle>
              <SheetDescription>
                <span className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{detail.domain.name}</Badge>
                  {detail.purpose && <span>{detail.purpose}</span>}
                </span>
              </SheetDescription>
            </SheetHeader>

            {/* Scrollable body */}
            <div className={styles.panel}>
              {/* Metadata grid */}
              <div className={styles.meta}>
                {detail.language && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Language</span>
                    <span className={styles.metaValue}>{detail.language}</span>
                  </div>
                )}
                {detail.framework && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Framework</span>
                    <span className={styles.metaValue}>
                      {detail.framework}
                      {detail.frameworkVersion
                        ? ` ${detail.frameworkVersion}`
                        : ""}
                    </span>
                  </div>
                )}
                {detail.repositoryUrl && isSafeUrl(detail.repositoryUrl) && (
                  <div
                    className={styles.metaItem}
                    style={{ gridColumn: "1 / -1" }}
                  >
                    <span className={styles.metaLabel}>Repository</span>
                    <a
                      href={detail.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.repoLink}
                    >
                      {detail.repositoryUrl}
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <Tabs defaultValue="services" className="flex-1">
                <TabsList className="w-full">
                  <TabsTrigger value="services" className="gap-1">
                    <Server className="size-3" />
                    Services ({detail.services.length})
                  </TabsTrigger>
                  <TabsTrigger value="databases" className="gap-1">
                    <Database className="size-3" />
                    DBs ({detail.databases.length})
                  </TabsTrigger>
                  <TabsTrigger value="integrations" className="gap-1">
                    <Globe className="size-3" />
                    Integrations ({detail.integrations.length})
                  </TabsTrigger>
                </TabsList>

                <TabsList className="mt-1 w-full">
                  <TabsTrigger value="kafka" className="gap-1">
                    <Radio className="size-3" />
                    Kafka ({detail.messageTopics.length})
                  </TabsTrigger>
                  <TabsTrigger value="packages" className="gap-1">
                    <Package className="size-3" />
                    Packages ({detail.packages.length})
                  </TabsTrigger>
                  <TabsTrigger value="risks" className="gap-1">
                    <AlertTriangle className="size-3" />
                    Risks ({detail.risks.length})
                  </TabsTrigger>
                </TabsList>

                {/* Services */}
                <TabsContent value="services" className={styles.tabContent}>
                  {detail.services.length === 0 ? (
                    <div className={styles.emptyState}>
                      No services found
                    </div>
                  ) : (
                    <div className={styles.itemList}>
                      {detail.services.map((svc) => (
                        <div key={svc.id} className={styles.item}>
                          <div>
                            <div className={styles.itemName}>{svc.name}</div>
                          </div>
                          <Badge variant="outline">{svc.type}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Databases */}
                <TabsContent value="databases" className={styles.tabContent}>
                  {detail.databases.length === 0 ? (
                    <div className={styles.emptyState}>
                      No databases found
                    </div>
                  ) : (
                    <div className={styles.itemList}>
                      {detail.databases.map((db) => (
                        <div key={db.id} className={styles.item}>
                          <div>
                            <div className={styles.itemName}>{db.name}</div>
                            <div className={styles.itemMeta}>
                              {[db.provider, db.version, db.orm]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Integrations */}
                <TabsContent
                  value="integrations"
                  className={styles.tabContent}
                >
                  {detail.integrations.length === 0 ? (
                    <div className={styles.emptyState}>
                      No integrations found
                    </div>
                  ) : (
                    <div className={styles.itemList}>
                      {detail.integrations.map((intg) => (
                        <div key={intg.id} className={styles.item}>
                          <div>
                            <div className={styles.itemName}>{intg.name}</div>
                            <div className={styles.itemMeta}>
                              {[intg.type, intg.targetSystem]
                                .filter(Boolean)
                                .join(" → ")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Kafka / Message Topics */}
                <TabsContent value="kafka" className={styles.tabContent}>
                  {detail.messageTopics.length === 0 ? (
                    <div className={styles.emptyState}>
                      No message topics found
                    </div>
                  ) : (
                    <div className={styles.itemList}>
                      {detail.messageTopics.map((topic) => (
                        <div key={topic.id} className={styles.item}>
                          <div>
                            <div className={styles.itemName}>{topic.name}</div>
                            <div className={styles.itemMeta}>
                              {topic.broker}
                            </div>
                          </div>
                          <Badge variant="outline">{topic.role}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Packages */}
                <TabsContent value="packages" className={styles.tabContent}>
                  {detail.packages.length === 0 ? (
                    <div className={styles.emptyState}>
                      No packages found
                    </div>
                  ) : (
                    <div className={styles.itemList}>
                      {detail.packages.map((pkg) => (
                        <div key={pkg.id} className={styles.item}>
                          <div>
                            <div className={styles.itemName}>{pkg.name}</div>
                            {pkg.version && (
                              <div className={styles.itemMeta}>
                                v{pkg.version}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline">{pkg.scope}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Risks */}
                <TabsContent value="risks" className={styles.tabContent}>
                  {detail.risks.length === 0 ? (
                    <div className={styles.emptyState}>
                      No risks found
                    </div>
                  ) : (
                    <div className={styles.itemList}>
                      {[...detail.risks]
                        .sort(
                          (a, b) =>
                            (SEVERITY_ORDER[a.severity] ?? 99) -
                            (SEVERITY_ORDER[b.severity] ?? 99),
                        )
                        .map((risk) => (
                          <div key={risk.id} className={styles.item}>
                            <div>
                              <div className={styles.itemName}>
                                {risk.title}
                              </div>
                              {risk.description && (
                                <div className={styles.itemMeta}>
                                  {risk.description}
                                </div>
                              )}
                            </div>
                            <SeverityBadge severity={risk.severity} />
                          </div>
                        ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer actions */}
            {onHighlightDependencies && (
              <SheetFooter className={styles.actions}>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleHighlight}
                >
                  <Highlighter className="size-4" />
                  Highlight dependencies
                </Button>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
