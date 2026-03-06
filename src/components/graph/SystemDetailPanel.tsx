"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
  Copy,
  ArrowRight,
  ArrowLeft,
  Route,
  FileText,
} from "lucide-react";
import clsx from "clsx";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-media-query";
import styles from "./SystemDetailPanel.module.css";

/* ────────────────────────────────────────────────────────── */
/*  Props                                                     */
/* ────────────────────────────────────────────────────────── */

interface SystemDetailPanelProps {
  systemId: string | null;
  onClose: () => void;
  onHighlightDependencies?: (systemId: string) => void;
  onNodeClick?: (nodeId: string) => void;
  workspaceSlug: string;
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

function ServiceTypeTag({ type }: { type: string }) {
  const cls: string | undefined = {
    API: styles.typeApi,
    WORKER: styles.typeWorker,
    CRONJOB: styles.typeCron,
    BACKGROUND_SERVICE: styles.typeBg,
  }[type];

  const label: string = {
    API: "API",
    WORKER: "Worker",
    CRONJOB: "Cron",
    BACKGROUND_SERVICE: "BG Svc",
  }[type] ?? type;

  return <span className={clsx(styles.typeTag, cls)}>{label}</span>;
}

function MethodTag({ method }: { method: string | null }) {
  if (!method) return null;
  const upper = method.toUpperCase();
  const cls: string | undefined = {
    GET: styles.methodGet,
    POST: styles.methodPost,
    PUT: styles.methodPut,
    PATCH: styles.methodPatch,
    DELETE: styles.methodDelete,
  }[upper];

  return <span className={clsx(styles.methodTag, cls)}>{upper}</span>;
}

function ScopeTag({ scope }: { scope: string }) {
  const cls: string | undefined = {
    INTERNAL: styles.scopeInternal,
    OPEN_SOURCE: styles.scopeOpenSource,
    TEST: styles.scopeTest,
  }[scope];

  const label: string = {
    INTERNAL: "Internal",
    OPEN_SOURCE: "OSS",
    TEST: "Test",
  }[scope] ?? scope;

  return <span className={clsx(styles.typeTag, cls)}>{label}</span>;
}

function depTypeClass(type: string): string | undefined {
  if (type === "HTTP_API") return styles.depTypeHttp;
  if (type === "GRPC") return styles.depTypeGrpc;
  if (type.startsWith("KAFKA") || type.startsWith("RABBITMQ") || type.startsWith("SQS")) return styles.depTypeKafka;
  if (type.includes("DATABASE")) return styles.depTypeDatabase;
  if (type.includes("PACKAGE")) return styles.depTypePackage;
  return styles.depTypeOther;
}

function depTypeLabel(type: string): string {
  if (type === "HTTP_API") return "HTTP";
  if (type === "GRPC") return "gRPC";
  if (type === "KAFKA_TOPIC") return "Kafka";
  if (type === "SHARED_DATABASE") return "DB";
  if (type === "SHARED_PACKAGE") return "Pkg";
  return type.replace(/_/g, " ").toLowerCase();
}

function worstSeverity(risks: SystemDetail["risks"]): string | null {
  if (risks.length === 0) return null;
  let worst = "LOW";
  for (const r of risks) {
    if ((SEVERITY_ORDER[r.severity] ?? 99) < (SEVERITY_ORDER[worst] ?? 99)) {
      worst = r.severity;
    }
  }
  return worst;
}

function severityDotColor(severity: string): string {
  return {
    CRITICAL: "var(--severity-critical)",
    HIGH: "var(--severity-high)",
    MEDIUM: "var(--severity-medium)",
    LOW: "var(--severity-low)",
  }[severity] ?? "var(--muted-foreground)";
}

/* ────────────────────────────────────────────────────────── */
/*  Component                                                 */
/* ────────────────────────────────────────────────────────── */

export function SystemDetailPanel({
  systemId,
  onClose,
  onHighlightDependencies,
  onNodeClick,
  workspaceSlug,
}: SystemDetailPanelProps) {
  const [detail, setDetail] = useState<SystemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("deps");
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();

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

  /* ── Copy ID handler ──────────────────────────────────── */
  const handleCopyId = useCallback(() => {
    if (!detail) return;
    navigator.clipboard.writeText(detail.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [detail]);

  /* ── Navigate to dependency ───────────────────────────── */
  const handleDepClick = useCallback(
    (targetId: string) => {
      onNodeClick?.(targetId);
    },
    [onNodeClick],
  );

  return (
    <Sheet open={systemId !== null} onOpenChange={handleOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "flex flex-col",
          isMobile ? "max-h-[85vh]" : "sm:max-w-lg",
        )}
      >
        {/* ── Loading state ──────────────────────────────── */}
        {loading && (
          <>
            <SheetHeader>
              <SheetTitle>Loading...</SheetTitle>
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
              {/* Quick actions */}
              <div className={styles.quickActions}>
                {detail.repositoryUrl && isSafeUrl(detail.repositoryUrl) && (
                  <a
                    href={detail.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.quickAction}
                    title="Open repository"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  className={styles.quickAction}
                  onClick={handleCopyId}
                  title={copied ? "Copied!" : "Copy system ID"}
                >
                  <Copy className="size-3.5" />
                </button>
                {onHighlightDependencies && (
                  <button
                    type="button"
                    className={styles.quickAction}
                    onClick={handleHighlight}
                    title="Highlight dependencies"
                  >
                    <Highlighter className="size-3.5" />
                  </button>
                )}
                <Link
                  href={`/w/${workspaceSlug}/systems/${detail.slug}`}
                  className={styles.quickAction}
                  title="View documentation"
                >
                  <FileText className="size-3.5" />
                </Link>
              </div>
            </SheetHeader>

            {/* Scrollable body */}
            <div className={styles.panel}>
              {/* ── Metadata grid ──────────────────────────── */}
              <div className={styles.meta}>
                {detail.language && (
                  <div className={styles.metaCell}>
                    <span className={styles.metaLabel}>Language</span>
                    <span className={styles.metaValue}>{detail.language}</span>
                  </div>
                )}
                {detail.framework && (
                  <div className={styles.metaCell}>
                    <span className={styles.metaLabel}>Framework</span>
                    <span className={styles.metaValue}>
                      {detail.framework}
                      {detail.frameworkVersion ? ` ${detail.frameworkVersion}` : ""}
                    </span>
                  </div>
                )}
                {detail.layer && (
                  <div className={styles.metaCell}>
                    <span className={styles.metaLabel}>Layer</span>
                    <span className={styles.metaValue}>
                      {detail.layer.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
                <div className={styles.metaCell}>
                  <span className={styles.metaLabel}>Slug</span>
                  <span className={styles.metaValueMono}>{detail.slug}</span>
                </div>
                {detail.repositoryUrl && isSafeUrl(detail.repositoryUrl) && (
                  <a
                    href={detail.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.repoLink}
                  >
                    {detail.repositoryUrl.replace(/^https?:\/\//, "")}
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                )}
              </div>

              {/* ── Tabs ───────────────────────────────────── */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <TabsList className="w-full flex-wrap h-auto gap-0.5">
                  <TabsTrigger value="deps" className="gap-1 text-xs">
                    <Highlighter className="size-3" /> Deps ({detail.dependsOn.length + detail.dependedBy.length})
                  </TabsTrigger>
                  <TabsTrigger value="services" className="gap-1 text-xs">
                    <Server className="size-3" /> Svc ({detail.services.length})
                  </TabsTrigger>
                  <TabsTrigger value="databases" className="gap-1 text-xs">
                    <Database className="size-3" /> DBs ({detail.databases.length})
                  </TabsTrigger>
                  <TabsTrigger value="integrations" className="gap-1 text-xs">
                    <Globe className="size-3" /> Int ({detail.integrations.length})
                  </TabsTrigger>
                  <TabsTrigger value="kafka" className="gap-1 text-xs">
                    <Radio className="size-3" /> Kafka ({detail.messageTopics.length})
                  </TabsTrigger>
                  <TabsTrigger value="packages" className="gap-1 text-xs">
                    <Package className="size-3" /> Pkg ({detail.packages.length})
                  </TabsTrigger>
                  <TabsTrigger value="risks" className="gap-1 text-xs">
                    <AlertTriangle className="size-3" /> Risks ({detail.risks.length})
                    {(() => {
                      const worst = worstSeverity(detail.risks);
                      return worst ? (
                        <span
                          className={styles.riskDot}
                          style={{ backgroundColor: severityDotColor(worst) }}
                        />
                      ) : null;
                    })()}
                  </TabsTrigger>
                  <TabsTrigger value="apis" className="gap-1 text-xs">
                    <Route className="size-3" /> APIs ({detail.apiEndpoints.length})
                  </TabsTrigger>
                </TabsList>

                {/* Dependencies */}
                <TabsContent value="deps" className={styles.tabContent}>
                  {detail.dependsOn.length === 0 && detail.dependedBy.length === 0 ? (
                    <div className={styles.emptyState}>No dependencies found</div>
                  ) : (
                    <div className={styles.depsSection}>
                      {detail.dependsOn.length > 0 && (
                        <div className={styles.depsGroup}>
                          <span className={styles.depsLabel}>Depends on</span>
                          {detail.dependsOn.map((dep) => (
                            <div
                              key={dep.id}
                              className={styles.depRow}
                              onClick={() => handleDepClick(dep.system.id)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") handleDepClick(dep.system.id);
                              }}
                            >
                              <ArrowRight className="size-3" style={{ color: "var(--muted-foreground)" }} />
                              <div className={styles.depNameGroup}>
                                <span className={styles.depName}>{dep.label ?? dep.system.name}</span>
                                {dep.label && (
                                  <span className={styles.depSystemName}>{dep.system.name}</span>
                                )}
                              </div>
                              <span className={clsx(styles.depType, depTypeClass(dep.type))}>
                                {depTypeLabel(dep.type)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {detail.dependedBy.length > 0 && (
                        <div className={styles.depsGroup}>
                          <span className={styles.depsLabel}>Consumed by</span>
                          {detail.dependedBy.map((dep) => (
                            <div
                              key={dep.id}
                              className={styles.depRow}
                              onClick={() => handleDepClick(dep.system.id)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") handleDepClick(dep.system.id);
                              }}
                            >
                              <ArrowLeft className="size-3" style={{ color: "var(--muted-foreground)" }} />
                              <div className={styles.depNameGroup}>
                                <span className={styles.depName}>{dep.label ?? dep.system.name}</span>
                                {dep.label && (
                                  <span className={styles.depSystemName}>{dep.system.name}</span>
                                )}
                              </div>
                              <span className={clsx(styles.depType, depTypeClass(dep.type))}>
                                {depTypeLabel(dep.type)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Services */}
                <TabsContent value="services" className={styles.tabContent}>
                  {detail.services.length === 0 ? (
                    <div className={styles.emptyState}>No services found</div>
                  ) : (
                    <div className={styles.itemList}>
                      {detail.services.map((svc) => (
                        <div key={svc.id} className={styles.item}>
                          <div className={styles.itemNameMono}>{svc.slug}</div>
                          <ServiceTypeTag type={svc.type} />
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Databases */}
                <TabsContent value="databases" className={styles.tabContent}>
                  {detail.databases.length === 0 ? (
                    <div className={styles.emptyState}>No databases found</div>
                  ) : (
                    <div className={styles.itemList}>
                      {detail.databases.map((db) => (
                        <div key={db.id} className={styles.item}>
                          <div>
                            <div className={styles.itemNameMono}>{db.name}</div>
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
                <TabsContent value="integrations" className={styles.tabContent}>
                  {detail.integrations.length === 0 ? (
                    <div className={styles.emptyState}>No integrations found</div>
                  ) : (
                    <div className={styles.itemList}>
                      {detail.integrations.map((intg) => (
                        <div key={intg.id} className={styles.item}>
                          <div>
                            <div className={styles.itemName}>{intg.name}</div>
                            <div className={styles.itemMeta}>
                              {[intg.type.replace(/_/g, " "), intg.targetSystem]
                                .filter(Boolean)
                                .join(" \u2192 ")}
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
                    <div className={styles.emptyState}>No message topics found</div>
                  ) : (
                    <div className={styles.itemList}>
                      {detail.messageTopics.map((topic) => (
                        <div key={topic.id} className={styles.item}>
                          <div>
                            <div className={styles.itemNameMono}>{topic.name}</div>
                            <div className={styles.itemMeta}>{topic.broker}</div>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              topic.role === "CONSUMER"
                                ? styles.roleConsumer
                                : topic.role === "PRODUCER"
                                  ? styles.roleProducer
                                  : styles.roleBoth
                            }
                          >
                            {topic.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Packages */}
                <TabsContent value="packages" className={styles.tabContent}>
                  {detail.packages.length === 0 ? (
                    <div className={styles.emptyState}>No packages found</div>
                  ) : (
                    <div className={styles.itemList}>
                      {detail.packages.map((pkg) => (
                        <div key={pkg.id} className={styles.item}>
                          <div>
                            <div className={styles.itemNameMono}>{pkg.name}</div>
                            {pkg.version && (
                              <div className={styles.itemMeta}>v{pkg.version}</div>
                            )}
                          </div>
                          <ScopeTag scope={pkg.scope} />
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Risks */}
                <TabsContent value="risks" className={styles.tabContent}>
                  {detail.risks.length === 0 ? (
                    <div className={styles.emptyState}>No risks found</div>
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
                            <div className="flex gap-2">
                              <span
                                className={styles.riskDot}
                                style={{ backgroundColor: severityDotColor(risk.severity) }}
                              />
                              <div>
                                <div className={styles.itemName}>{risk.title}</div>
                                {risk.description && (
                                  <div className={styles.itemMeta}>{risk.description}</div>
                                )}
                              </div>
                            </div>
                            <SeverityBadge severity={risk.severity} />
                          </div>
                        ))}
                    </div>
                  )}
                </TabsContent>

                {/* APIs */}
                <TabsContent value="apis" className={styles.tabContent}>
                  {detail.apiEndpoints.length === 0 ? (
                    <div className={styles.emptyState}>No API endpoints found</div>
                  ) : (
                    <div className={styles.itemList}>
                      {detail.apiEndpoints.map((ep) => (
                        <div key={ep.id} className={styles.apiRow}>
                          <MethodTag method={ep.method} />
                          <div>
                            <div className={styles.apiPath}>{ep.path}</div>
                            {ep.description && (
                              <div className={styles.apiDesc}>{ep.description}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer actions */}
            <SheetFooter className={styles.actions}>
              <div className="flex w-full gap-2">
                {onHighlightDependencies && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={handleHighlight}
                  >
                    <Highlighter className="size-4" />
                    Highlight dependencies
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  asChild
                >
                  <Link href={`/w/${workspaceSlug}/systems/${detail.slug}`}>
                    <Server className="size-4" />
                    View system page
                  </Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
