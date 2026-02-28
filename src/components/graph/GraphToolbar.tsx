"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, ChevronDown, RotateCcw, Eye, EyeOff, Zap, Layers, Group } from "lucide-react";
import clsx from "clsx";
import {
  DEPENDENCY_TYPE_CONFIG,
  DEPENDENCY_TYPES,
  type DependencyTypeName,
} from "@/modules/graph/constants";
import { useGraphFilters } from "./useGraphFilters";
import styles from "./GraphToolbar.module.css";

export interface GraphToolbarProps {
  /** List of all available domain names to choose from. */
  availableDomains: string[];
  /** List of all available programming languages to choose from. */
  availableLanguages: string[];
  /** Total node count before filtering. */
  totalNodes: number;
  /** Total edge count before filtering. */
  totalEdges: number;
  /** Filtered node count. */
  filteredNodes: number;
  /** Filtered edge count. */
  filteredEdges: number;
}

/* ── Dropdown helper ─────────────────────────────────────────── */

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return { open, setOpen, ref };
}

/* ── Multi-select dropdown ───────────────────────────────────── */

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  renderOption,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  renderOption?: (option: string) => React.ReactNode;
}) {
  const { open, setOpen, ref } = useDropdown();

  const toggle = useCallback(
    (value: string) => {
      onChange(
        selected.includes(value)
          ? selected.filter((v) => v !== value)
          : [...selected, value],
      );
    },
    [selected, onChange],
  );

  return (
    <div className={styles.filterGroup} ref={ref}>
      <button
        type="button"
        className={clsx(styles.filterButton, {
          [styles.filterButtonActive ?? ""]: selected.length > 0,
        })}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {label}
        {selected.length > 0 && (
          <span className={styles.badge}>{selected.length}</span>
        )}
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className={styles.filterDropdown} role="listbox" aria-label={label}>
          {options.map((option) => (
            <label key={option} className={styles.filterOption}>
              <input
                type="checkbox"
                className={styles.filterCheckbox}
                checked={selected.includes(option)}
                onChange={() => toggle(option)}
              />
              {renderOption ? renderOption(option) : option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Dependency type option with colored swatch ──────────────── */

function DepTypeOption({ type }: { type: string }) {
  const config = DEPENDENCY_TYPE_CONFIG[type as DependencyTypeName];
  if (!config) return <span>{type}</span>;
  return (
    <>
      <span
        className={styles.colorSwatch}
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </>
  );
}

/* ── Color legend ────────────────────────────────────────────── */

function ColorLegend({ visibleTypes }: { visibleTypes: string[] }) {
  const items = visibleTypes.length > 0 ? visibleTypes : [...DEPENDENCY_TYPES];

  return (
    <div className={styles.legend} aria-label="Dependency type legend">
      {items.map((type) => {
        const config = DEPENDENCY_TYPE_CONFIG[type as DependencyTypeName];
        if (!config) return null;
        return (
          <span key={type} className={styles.legendItem}>
            <span
              className={styles.legendLine}
              style={{ backgroundColor: config.color }}
            />
            {config.label}
          </span>
        );
      })}
    </div>
  );
}

/* ── Main toolbar ────────────────────────────────────────────── */

export function GraphToolbar({
  availableDomains,
  availableLanguages,
  totalNodes,
  totalEdges,
  filteredNodes,
  filteredEdges,
}: GraphToolbarProps) {
  const { filters, setFilters, resetFilters } = useGraphFilters();

  const hasActiveFilters =
    filters.domains.length > 0 ||
    filters.dependencyTypes.length > 0 ||
    filters.languages.length > 0 ||
    filters.search.trim() !== "" ||
    !filters.showIsolated ||
    !filters.showParticles ||
    filters.layoutMode !== "default" ||
    filters.clustering;

  const depTypeOptions = [...DEPENDENCY_TYPES] as string[];

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Graph filters">
      {/* Search */}
      <div className={styles.searchWrapper}>
        <Search size={14} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search systems…"
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          aria-label="Search systems"
        />
        <kbd className={styles.kbd}>
          <span>⌘</span>K
        </kbd>
      </div>

      <span className={styles.separator} />

      {/* Domain multi-select */}
      {availableDomains.length > 0 && (
        <MultiSelect
          label="Domain"
          options={availableDomains}
          selected={filters.domains}
          onChange={(domains) => setFilters({ domains })}
        />
      )}

      {/* Dependency type multi-select with colored checkboxes */}
      <MultiSelect
        label="Dependency Type"
        options={depTypeOptions}
        selected={filters.dependencyTypes}
        onChange={(dependencyTypes) => setFilters({ dependencyTypes })}
        renderOption={(option) => <DepTypeOption type={option} />}
      />

      {/* Language multi-select */}
      {availableLanguages.length > 0 && (
        <MultiSelect
          label="Language"
          options={availableLanguages}
          selected={filters.languages}
          onChange={(languages) => setFilters({ languages })}
        />
      )}

      <span className={styles.separator} />

      {/* Toggle isolated systems */}
      <button
        type="button"
        className={clsx(styles.toggle, {
          [styles.toggleActive ?? ""]: !filters.showIsolated,
        })}
        onClick={() => setFilters({ showIsolated: !filters.showIsolated })}
        aria-pressed={!filters.showIsolated}
        title={
          filters.showIsolated
            ? "Hide isolated systems"
            : "Show isolated systems"
        }
      >
        {filters.showIsolated ? <Eye size={14} /> : <EyeOff size={14} />}
        Isolated
      </button>

      {/* Toggle particle animation */}
      <button
        type="button"
        className={clsx(styles.toggle, {
          [styles.toggleActive ?? ""]: filters.showParticles,
        })}
        onClick={() => setFilters({ showParticles: !filters.showParticles })}
        aria-pressed={filters.showParticles}
        title={
          filters.showParticles
            ? "Disable flow animation"
            : "Enable flow animation"
        }
      >
        <Zap size={14} />
        Flow
      </button>

      {/* Toggle layered topology */}
      <button
        type="button"
        className={clsx(styles.toggle, {
          [styles.toggleActive ?? ""]: filters.layoutMode === "layered",
        })}
        onClick={() =>
          setFilters({
            layoutMode: filters.layoutMode === "layered" ? "default" : "layered",
          })
        }
        aria-pressed={filters.layoutMode === "layered"}
        title={
          filters.layoutMode === "layered"
            ? "Switch to default layout"
            : "Switch to layered topology"
        }
      >
        <Layers size={14} />
        Layered
      </button>

      {/* Toggle domain clustering */}
      <button
        type="button"
        className={clsx(styles.toggle, {
          [styles.toggleActive ?? ""]: filters.clustering,
        })}
        onClick={() => setFilters({ clustering: !filters.clustering })}
        aria-pressed={filters.clustering}
        title={
          filters.clustering
            ? "Disable domain clustering"
            : "Enable domain clustering"
        }
      >
        <Group size={14} />
        Cluster
      </button>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          type="button"
          className={styles.resetButton}
          onClick={resetFilters}
          aria-label="Reset all filters"
        >
          <RotateCcw size={14} />
        </button>
      )}

      <span className={styles.separator} />

      {/* Legend */}
      <ColorLegend visibleTypes={filters.dependencyTypes} />

      {/* Counter */}
      <span className={styles.counter} aria-live="polite">
        {filteredNodes} / {totalNodes} systems · {filteredEdges} / {totalEdges}{" "}
        dependencies
      </span>
    </div>
  );
}
