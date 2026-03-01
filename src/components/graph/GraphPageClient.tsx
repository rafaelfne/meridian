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
import { HighlightNavigationBar } from "./HighlightNavigationBar";

interface GraphPageClientProps {
  data: GraphData;
  systems?: SystemWithCounts[];
  dependencies?: DependencyRecord[];
  snapshots?: SnapshotMeta[];
  workspaceSlug: string;
}

const POSITIONS_STORAGE_KEY = "meridian_layout_positions";
const EDGE_OFFSETS_STORAGE_KEY = "meridian_layout_edge_offsets";

function readFromStorage<T extends object>(key: string): T {
  if (typeof window === "undefined") return {} as T;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

function GraphPageClientInner({
  data,
  systems,
  dependencies,
  snapshots = [],
  workspaceSlug,
}: GraphPageClientProps) {
  const { filters } = useGraphFilters();

  // Persistent layout positions and edge offsets keyed by layoutKey
  const savedPositionsRef = useRef<
    Record<string, Record<string, { x: number; y: number }>>
  >(readFromStorage(POSITIONS_STORAGE_KEY));
  const savedEdgeOffsetsRef = useRef<Record<string, Record<string, number>>>(
    readFromStorage(EDGE_OFFSETS_STORAGE_KEY),
  );

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
        const res = await fetch(`/api/w/${workspaceSlug}/graph/snapshots/${snapshotId}`);
        const json = await res.json();
        setSnapshotData(json as GraphData);
      } finally {
        setIsLoadingSnapshot(false);
      }
    },
    [workspaceSlug],
  );

  // Active data source: snapshot or live
  const activeData = snapshotData ?? data;
  const isViewingSnapshot = snapshotData !== null;

  // Key that identifies the current layout mode for position persistence
  const layoutKey = `${workspaceSlug}_${filters.layoutMode}_${filters.clustering ? "c" : "p"}`;

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

  // Apply saved positions so user drag adjustments survive layout mode switches
  const displayDataWithPositions = useMemo(() => {
    if (isViewingSnapshot) return displayData;
    const saved = savedPositionsRef.current[layoutKey];
    if (!saved) return displayData;
    return {
      ...displayData,
      nodes: displayData.nodes.map((node) => {
        const pos = saved[node.id];
        return pos ? { ...node, position: pos } : node;
      }),
    };

  }, [displayData, layoutKey, isViewingSnapshot]);

  const handleNodePositionsChange = useCallback(
    (positions: Record<string, { x: number; y: number }>) => {
      savedPositionsRef.current[layoutKey] = positions;
      try {
        localStorage.setItem(
          POSITIONS_STORAGE_KEY,
          JSON.stringify(savedPositionsRef.current),
        );
      } catch {
        // storage quota exceeded — ignore
      }
    },
    [layoutKey],
  );

  const handleEdgeOffsetsChange = useCallback(
    (offsets: Record<string, number>) => {
      savedEdgeOffsetsRef.current[layoutKey] = offsets;
      try {
        localStorage.setItem(
          EDGE_OFFSETS_STORAGE_KEY,
          JSON.stringify(savedEdgeOffsetsRef.current),
        );
      } catch {
        // ignore
      }
    },
    [layoutKey],
  );

  const visibleNodeIds = useMemo(
    () => new Set(displayData.nodes.map((n) => n.id)),
    [displayData.nodes],
  );

  // Interaction state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedSystemId, setHighlightedSystemId] = useState<
    string | null
  >(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleHighlightDependencies = useCallback((systemId: string) => {
    setHighlightedSystemId((prev) => {
      const next = prev === systemId ? null : systemId;
      if (!next) setFocusedNodeId(null);
      return next;
    });
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
            data={displayDataWithPositions}
            onNodeClick={handleNodeClick}
            onHighlight={handleHighlightDependencies}
            highlightedSystemId={highlightedSystemId}
            focusedNodeId={focusedNodeId}
            onViewportChange={
              !isViewingSnapshot && filters.clustering
                ? handleViewportChange
                : undefined
            }
            initialEdgeOffsets={
              isViewingSnapshot
                ? undefined
                : savedEdgeOffsetsRef.current[layoutKey]
            }
            onNodePositionsChange={
              isViewingSnapshot ? undefined : handleNodePositionsChange
            }
            onEdgeOffsetsChange={
              isViewingSnapshot ? undefined : handleEdgeOffsetsChange
            }
          />
          <TimeMachineSlider
            snapshots={snapshots}
            onSnapshotSelect={handleSnapshotSelect}
            isLoading={isLoadingSnapshot}
          />
          <HighlightNavigationBar
            highlightedSystemId={highlightedSystemId}
            nodes={filteredData.nodes}
            edges={filteredData.edges}
            onNodeClick={handleNodeClick}
            onFocusNode={setFocusedNodeId}
          />
        </div>
        <SystemDetailPanel
          systemId={selectedNodeId}
          onClose={handleClosePanel}
          onHighlightDependencies={handleHighlightDependencies}
          onNodeClick={handleNodeClick}
          workspaceSlug={workspaceSlug}
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
