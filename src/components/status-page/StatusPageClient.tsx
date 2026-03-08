"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Globe,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import type { StatusPageData } from "@/app/status/[slug]/page";
import type { HealthStatus } from "@/modules/status-page/health";
import { overallBanner, statusLabel } from "@/modules/status-page/health";

/* ── Helpers ─────────────────────────────────── */

const STATUS_COLORS: Record<
  HealthStatus,
  {
    text: string;
    dot: string;
    bar: string;
    border: string;
    bgSubtle: string;
    gradient: string;
  }
> = {
  operational: {
    text: "text-emerald-400",
    dot: "bg-emerald-400 shadow-[0_0_8px_theme(colors.emerald.400)]",
    bar: "bg-emerald-500/40",
    border: "border-emerald-500/20",
    bgSubtle: "bg-emerald-500/10",
    gradient: "bg-gradient-to-r from-emerald-500/20 to-emerald-500/10",
  },
  partial_outage: {
    text: "text-amber-400",
    dot: "bg-amber-400 shadow-[0_0_8px_theme(colors.amber.400)]",
    bar: "bg-amber-500",
    border: "border-amber-500/20",
    bgSubtle: "bg-amber-500/10",
    gradient: "bg-gradient-to-r from-amber-500/20 to-amber-500/10",
  },
  major_outage: {
    text: "text-rose-500",
    dot: "bg-rose-500 shadow-[0_0_8px_theme(colors.rose.500)]",
    bar: "bg-rose-500",
    border: "border-rose-500/20",
    bgSubtle: "bg-rose-500/10",
    gradient: "bg-gradient-to-r from-rose-500/20 to-rose-500/10",
  },
};

function statusIcon(status: HealthStatus, className: string) {
  switch (status) {
    case "operational":
      return <CheckCircle2 className={className} />;
    case "partial_outage":
      return <AlertTriangle className={className} />;
    case "major_outage":
      return <XCircle className={className} />;
  }
}

function generateHistory(status: HealthStatus): HealthStatus[] {
  return Array.from({ length: 40 }, (_, i) => {
    switch (status) {
      case "operational":
        return "operational";
      case "partial_outage":
        return i > 34 ? "partial_outage" : "operational";
      case "major_outage":
        if (i > 36) return "major_outage";
        if (i > 31) return "partial_outage";
        return "operational";
    }
  });
}

function uptimePercent(status: HealthStatus): string {
  switch (status) {
    case "operational":
      return "100";
    case "partial_outage":
      return "98.45";
    case "major_outage":
      return "95.20";
  }
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "less than a minute ago";
  if (diffMin === 1) return "1 minute ago";
  if (diffMin < 60) return `${diffMin} minutes ago`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH === 1) return "1 hour ago";
  return `${diffH} hours ago`;
}

/* ── Component ───────────────────────────────── */

export function StatusPageClient({ data }: { data: StatusPageData }) {
  const router = useRouter();
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 60_000);
    return () => clearInterval(interval);
  }, [router]);

  const toggleExpand = useCallback((productId: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const { whiteLabel } = data;
  const pc = whiteLabel.primaryColor;
  const overallColors = STATUS_COLORS[data.overall];
  const usePrimary = data.overall === "operational" && !!pc;

  return (
    <div className="h-screen overflow-y-auto bg-background text-foreground">
      {/* Header */}
      <header className="pt-16 pb-12 flex flex-col items-center text-center px-4">
        {whiteLabel.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={whiteLabel.logoUrl} alt="" className="h-14 w-auto mb-6" />
        ) : (
          <div className="size-14 rounded-2xl flex items-center justify-center shadow-2xl mb-6 bg-foreground">
            <div className="size-8 rounded-sm flex items-center justify-center font-black text-xl bg-background text-foreground">
              {(whiteLabel.pageTitle || data.workspaceName)
                .charAt(0)
                .toUpperCase()}
            </div>
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {whiteLabel.pageTitle || `${data.workspaceName} Status`}
        </h1>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Globe className="size-4" />
          <span>Real-time monitoring of our services</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-24 space-y-8">
        {/* Hero Banner */}
        <section className="relative group">
          {/* Glow */}
          <div
            className="absolute -inset-1 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"
            style={
              usePrimary
                ? {
                    background: `linear-gradient(to right, ${pc}33, ${pc}1a)`,
                  }
                : undefined
            }
          >
            {!usePrimary && (
              <div
                className={`w-full h-full rounded-3xl ${overallColors.gradient}`}
              />
            )}
          </div>

          {/* Card */}
          <div
            className={`relative bg-card/80 backdrop-blur-xl border ${overallColors.border} rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xl`}
            style={
              usePrimary
                ? { borderColor: `${pc}33` }
                : undefined
            }
          >
            {/* Animated icon */}
            <div
              className="size-12 rounded-full flex items-center justify-center mb-4 relative"
              style={
                usePrimary
                  ? { backgroundColor: `${pc}1a` }
                  : undefined
              }
            >
              {usePrimary ? (
                <>
                  <div
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ backgroundColor: `${pc}33` }}
                  />
                  <CheckCircle2
                    className="size-7 relative z-10"
                    style={{ color: pc! }}
                  />
                </>
              ) : (
                <>
                  <div
                    className={`absolute inset-0 rounded-full ${overallColors.bgSubtle} animate-ping`}
                  />
                  {statusIcon(
                    data.overall,
                    `size-7 relative z-10 ${overallColors.text}`,
                  )}
                </>
              )}
            </div>

            <h2 className="text-xl font-semibold tracking-wide">
              {usePrimary ? (
                <span style={{ color: pc! }}>{overallBanner(data.overall)}</span>
              ) : (
                <span className={overallColors.text}>
                  {overallBanner(data.overall)}
                </span>
              )}
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              Verified{" "}
              <time dateTime={data.lastUpdated}>
                {formatRelativeTime(data.lastUpdated)}
              </time>
            </p>
          </div>
        </section>

        {/* Products */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2 text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
            <span>Services</span>
            <span className="flex items-center gap-1">
              <RefreshCcw className="size-3" /> Auto-refresh
            </span>
          </div>

          <div className="space-y-3">
            {data.products.map((product) => {
              const isExpanded = expandedProducts.has(product.id);
              const history = generateHistory(product.status);
              const pColors = STATUS_COLORS[product.status];
              const pUsePrimary = product.status === "operational" && !!pc;

              return (
                <div
                  key={product.id}
                  className="bg-card border rounded-2xl overflow-hidden transition-all hover:border-muted-foreground/20 shadow-sm"
                >
                  <div
                    onClick={() => toggleExpand(product.id)}
                    className="p-5 flex flex-col gap-4 cursor-pointer"
                  >
                    {/* Product header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">
                          {isExpanded ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                        </div>
                        <span className="font-semibold">
                          {product.publicName}
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${pUsePrimary ? "" : pColors.text}`}
                        style={pUsePrimary ? { color: pc! } : undefined}
                      >
                        <span
                          className={`size-1.5 rounded-full ${pUsePrimary ? "" : pColors.dot}`}
                          style={
                            pUsePrimary
                              ? {
                                  backgroundColor: pc!,
                                  boxShadow: `0 0 8px ${pc}`,
                                }
                              : undefined
                          }
                        />
                        {statusLabel(product.status)}
                      </div>
                    </div>

                    {/* Uptime bars */}
                    <div className="space-y-2">
                      <div className="flex gap-[2px] h-8">
                        {history.map((dayStatus, idx) => {
                          const dUsePrimary =
                            dayStatus === "operational" && !!pc;
                          const dColors = STATUS_COLORS[dayStatus];
                          return (
                            <div
                              key={idx}
                              className={`flex-1 rounded-sm transition-all hover:scale-y-110 ${dUsePrimary ? "" : dColors.bar}`}
                              style={
                                dUsePrimary
                                  ? {
                                      backgroundColor: `color-mix(in srgb, ${pc} 40%, transparent)`,
                                    }
                                  : undefined
                              }
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground font-medium px-0.5">
                        <span>90 days ago</span>
                        <span
                          className={pUsePrimary ? "" : pColors.text}
                          style={pUsePrimary ? { color: pc! } : undefined}
                        >
                          {uptimePercent(product.status)}% uptime
                        </span>
                        <span>Today</span>
                      </div>
                    </div>
                  </div>

                  {/* Features (expanded) */}
                  {isExpanded && product.features.length > 0 && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="bg-muted/30 rounded-xl border overflow-hidden divide-y">
                        {product.features.map((feature) => {
                          const fColors = STATUS_COLORS[feature.status];
                          const fUsePrimary =
                            feature.status === "operational" && !!pc;
                          return (
                            <div
                              key={feature.id}
                              className="px-4 py-3 flex items-center justify-between"
                            >
                              <span className="text-xs text-muted-foreground">
                                {feature.publicName}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-tight ${fUsePrimary ? "" : fColors.text}`}
                                style={
                                  fUsePrimary ? { color: pc! } : undefined
                                }
                              >
                                {statusLabel(feature.status)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-12 border-t flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Last updated:{" "}
              <time dateTime={data.lastUpdated}>
                {new Date(data.lastUpdated).toLocaleString()}
              </time>
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              <span>Systems monitored 24/7</span>
            </div>
          </div>
          {!whiteLabel.hidePoweredBy && (
            <p className="text-xs text-muted-foreground mt-4">
              Powered by{" "}
              <span
                className="font-bold tracking-tight"
                style={pc ? { color: pc } : undefined}
              >
                Meridian
              </span>
            </p>
          )}
        </footer>
      </main>
    </div>
  );
}
