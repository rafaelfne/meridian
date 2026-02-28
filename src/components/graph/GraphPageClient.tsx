"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import type { GraphData } from "@/modules/graph/types";
import {
  filterGraphData,
  extractDomains,
  extractLanguages,
} from "@/modules/graph/services/filter-graph-data";
import { useGraphFilters } from "./useGraphFilters";
import { GraphToolbar } from "./GraphToolbar";
import { DependencyGraph } from "./DependencyGraph";
import { SystemDetailPanel } from "./SystemDetailPanel";

interface GraphPageClientProps {
  data: GraphData;
}

function GraphPageClientInner({ data }: GraphPageClientProps) {
  const { filters } = useGraphFilters();

  // Derive available filter options from unfiltered data
  const availableDomains = useMemo(
    () => extractDomains(data.nodes),
    [data.nodes],
  );
  const availableLanguages = useMemo(
    () => extractLanguages(data.nodes),
    [data.nodes],
  );

  // Apply filters
  const filteredData = useMemo(
    () => filterGraphData(data, filters),
    [data, filters],
  );

  // Interaction state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedSystemId, setHighlightedSystemId] = useState<
    string | null
  >(null);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleHighlightDependencies = useCallback((systemId: string) => {
    setHighlightedSystemId((prev) =>
      prev === systemId ? null : systemId,
    );
  }, []);

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <GraphToolbar
        availableDomains={availableDomains}
        availableLanguages={availableLanguages}
        totalNodes={data.nodes.length}
        totalEdges={data.edges.length}
        filteredNodes={filteredData.nodes.length}
        filteredEdges={filteredData.edges.length}
      />
      <DependencyGraph
        data={filteredData}
        onNodeClick={handleNodeClick}
        highlightedSystemId={highlightedSystemId}
      />
      <SystemDetailPanel
        systemId={selectedNodeId}
        onClose={handleClosePanel}
        onHighlightDependencies={handleHighlightDependencies}
      />
    </div>
  );
}

export function GraphPageClient({ data }: GraphPageClientProps) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <GraphPageClientInner data={data} />
    </Suspense>
  );
}
