"use client";

import { useState, useMemo, useCallback, useRef, Suspense } from "react";
import { ReactFlowProvider, type Viewport } from "@xyflow/react";
import type {
  GraphData,
  SystemWithCounts,
  DependencyRecord,
} from "@/modules/graph/types";
import {
  filterGraphData,
  extractDomains,
  extractLanguages,
} from "@/modules/graph/services/filter-graph-data";
import { buildLayeredGraphData } from "@/modules/graph/services/build-layered-graph-data";
import { buildClusteredGraphData } from "@/modules/graph/services/build-clustered-graph-data";
import { collapseDomainClusters } from "@/modules/graph/services/collapse-domain-clusters";
import {
  COLLAPSE_ZOOM_THRESHOLD,
  EXPAND_ZOOM_THRESHOLD,
} from "@/modules/graph/constants";
import { useGraphFilters } from "./useGraphFilters";
import { GraphToolbar } from "./GraphToolbar";
import { DependencyGraph } from "./DependencyGraph";
import { SystemDetailPanel } from "./SystemDetailPanel";
import { GraphCommandSearch } from "./GraphCommandSearch";
import {
  TimeMachineSlider,
  type SnapshotMeta,
} from "./TimeMachineSlider";

interface GraphPageClientProps {
  data: GraphData;
  systems?: SystemWithCounts[];
  dependencies?: DependencyRecord[];
  snapshots?: SnapshotMeta[];
}

function GraphPageClientInner({
  data,
  systems,
  dependencies,
  snapshots = [],
}: GraphPageClientProps) {
  const { filters } = useGraphFilters();

  // Time Machine state
  const [snapshotData, setSnapshotData] = useState<GraphData | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);

  const handleSnapshotSelect = useCallback(
    async (snapshotId: string | null) => {
      if (!snapshotId) {
        setSnapshotData(null);
        return;
      }
      setIsLoadingSnapshot(true);
      try {
        const res = await fetch(`/api/graph/snapshots/${snapshotId}`);
        const json = await res.json();
        setSnapshotData(json as GraphData);
      } finally {
        setIsLoadingSnapshot(false);
      }
    },
    [],
  );

  // Active data source: snapshot or live
  const activeData = snapshotData ?? data;
  const isViewingSnapshot = snapshotData !== null;

  // Compute layout based on mode
  const layoutData = useMemo(() => {
    if (isViewingSnapshot) return activeData;
    if (filters.layoutMode === "layered" && systems && dependencies) {
      return buildLayeredGraphData(systems, dependencies);
    }
    return activeData;
  }, [filters.layoutMode, systems, dependencies, activeData, isViewingSnapshot]);

  // Derive available filter options from unfiltered data
  const availableDomains = useMemo(
    () => extractDomains(layoutData.nodes),
    [layoutData.nodes],
  );
  const availableLanguages = useMemo(
    () => extractLanguages(layoutData.nodes),
    [layoutData.nodes],
  );

  // Apply filters
  const filteredData = useMemo(
    () => filterGraphData(layoutData, filters),
    [layoutData, filters],
  );

  // Clustering state
  const [collapsed, setCollapsed] = useState(false);
  const collapsedRef = useRef(collapsed);
  collapsedRef.current = collapsed;

  const handleViewportChange = useCallback((viewport: Viewport) => {
    if (viewport.zoom < COLLAPSE_ZOOM_THRESHOLD && !collapsedRef.current) {
      setCollapsed(true);
    } else if (viewport.zoom >= EXPAND_ZOOM_THRESHOLD && collapsedRef.current) {
      setCollapsed(false);
    }
  }, []);

  // Apply clustering transformations
  const displayData = useMemo(() => {
    if (isViewingSnapshot) return filteredData;
    if (!filters.clustering) return filteredData;

    const clustered = buildClusteredGraphData(filteredData);
    if (collapsed) {
      return collapseDomainClusters(clustered);
    }
    return clustered;
  }, [filteredData, filters.clustering, collapsed, isViewingSnapshot]);

  const visibleNodeIds = useMemo(
    () => new Set(displayData.nodes.map((n) => n.id)),
    [displayData.nodes],
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
    <ReactFlowProvider>
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
        <GraphToolbar
          availableDomains={availableDomains}
          availableLanguages={availableLanguages}
          totalNodes={activeData.nodes.length}
          totalEdges={activeData.edges.length}
          filteredNodes={filteredData.nodes.length}
          filteredEdges={filteredData.edges.length}
        />
        <div className="relative flex flex-col flex-1 min-h-0">
          <DependencyGraph
            data={displayData}
            onNodeClick={handleNodeClick}
            onNodeLongPress={handleHighlightDependencies}
            highlightedSystemId={highlightedSystemId}
            onViewportChange={
              !isViewingSnapshot && filters.clustering
                ? handleViewportChange
                : undefined
            }
          />
          <TimeMachineSlider
            snapshots={snapshots}
            onSnapshotSelect={handleSnapshotSelect}
            isLoading={isLoadingSnapshot}
          />
        </div>
        <SystemDetailPanel
          systemId={selectedNodeId}
          onClose={handleClosePanel}
          onHighlightDependencies={handleHighlightDependencies}
          onNodeClick={handleNodeClick}
        />
        <GraphCommandSearch
          nodes={layoutData.nodes}
          visibleNodeIds={visibleNodeIds}
        />
      </div>
    </ReactFlowProvider>
  );
}

export function GraphPageClient(props: GraphPageClientProps) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <GraphPageClientInner {...props} />
    </Suspense>
  );
}
