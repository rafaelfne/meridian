"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { StatusPageData } from "@/app/status/[slug]/page";
import type { HealthStatus } from "@/modules/status-page/health";
import { overallBanner, statusLabel } from "@/modules/status-page/health";

function StatusBadge({ status }: { status: HealthStatus }) {
  switch (status) {
    case "operational":
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4" />
          {statusLabel(status)}
        </span>
      );
    case "partial_outage":
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-4" />
          {statusLabel(status)}
        </span>
      );
    case "major_outage":
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
          <XCircle className="size-4" />
          {statusLabel(status)}
        </span>
      );
  }
}

function OverallBanner({ status }: { status: HealthStatus }) {
  const base = "rounded-lg px-6 py-4 text-center text-lg font-semibold";
  switch (status) {
    case "operational":
      return (
        <div className={`${base} bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200`}>
          <CheckCircle2 className="mx-auto mb-1 size-6" />
          {overallBanner(status)}
        </div>
      );
    case "partial_outage":
      return (
        <div className={`${base} bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200`}>
          <AlertTriangle className="mx-auto mb-1 size-6" />
          {overallBanner(status)}
        </div>
      );
    case "major_outage":
      return (
        <div className={`${base} bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200`}>
          <XCircle className="mx-auto mb-1 size-6" />
          {overallBanner(status)}
        </div>
      );
  }
}

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-center text-2xl font-bold tracking-tight">
        {data.workspaceName} Status
      </h1>

      <OverallBanner status={data.overall} />

      <div className="mt-8 space-y-2">
        {data.products.map((product) => {
          const isExpanded = expandedProducts.has(product.id);
          return (
            <div key={product.id} className="rounded-lg border">
              <button
                type="button"
                onClick={() => toggleExpand(product.id)}
                className="flex w-full items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">{product.publicName}</span>
                </div>
                <StatusBadge status={product.status} />
              </button>

              {isExpanded && product.features.length > 0 && (
                <div className="border-t px-4 py-2">
                  {product.features.map((feature) => (
                    <div
                      key={feature.id}
                      className="flex items-center justify-between py-2 pl-6"
                    >
                      <span className="text-sm text-muted-foreground">
                        {feature.publicName}
                      </span>
                      <StatusBadge status={feature.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Last updated{" "}
        <time dateTime={data.lastUpdated}>
          {new Date(data.lastUpdated).toLocaleString()}
        </time>
      </p>
    </div>
  );
}
