"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  DEFAULT_GRAPH_FILTERS,
  type GraphFilters,
} from "@/modules/graph/services/filter-graph-data";

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function serializeList(items: string[]): string | null {
  return items.length > 0 ? items.join(",") : null;
}

/**
 * Hook that reads/writes graph filter state from URL search params.
 * Every setter replaces the URL (no history entry) so the URL stays shareable.
 */
export function useGraphFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: GraphFilters = useMemo(
    () => ({
      domains: parseList(searchParams.get("domains")),
      dependencyTypes: parseList(searchParams.get("depTypes")),
      languages: parseList(searchParams.get("languages")),
      search: searchParams.get("search") ?? "",
      showIsolated: searchParams.get("showIsolated") !== "false",
    }),
    [searchParams],
  );

  const setFilters = useCallback(
    (next: Partial<GraphFilters>) => {
      const merged = { ...filters, ...next };
      const params = new URLSearchParams();

      const domains = serializeList(merged.domains);
      if (domains) params.set("domains", domains);

      const depTypes = serializeList(merged.dependencyTypes);
      if (depTypes) params.set("depTypes", depTypes);

      const languages = serializeList(merged.languages);
      if (languages) params.set("languages", languages);

      if (merged.search.trim()) params.set("search", merged.search.trim());

      if (!merged.showIsolated) params.set("showIsolated", "false");

      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [filters, pathname, router],
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_GRAPH_FILTERS);
  }, [setFilters]);

  return { filters, setFilters, resetFilters };
}
