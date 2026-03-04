"use client";

import { Fragment, useState, useMemo, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SystemListItemWithServices } from "@/modules/system/types";
import { updateSlugsAction } from "@/modules/system/actions/update-slugs";
import styles from "./SystemsTable.module.css";
import clsx from "clsx";

type SortField = "name" | "domain" | "language" | "framework";
type SortDirection = "asc" | "desc";

interface SystemsTableProps {
  systems: SystemListItemWithServices[];
  domains: { id: string; name: string }[];
  workspaceSlug: string;
}

export function SystemsTable({
  systems,
  domains,
  workspaceSlug,
}: SystemsTableProps) {
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("__all__");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editedSystemSlugs, setEditedSystemSlugs] = useState<
    Record<string, string>
  >({});
  const [editedServiceSlugs, setEditedServiceSlugs] = useState<
    Record<string, string>
  >({});
  const [isSaving, startSaveTransition] = useTransition();

  const isDirty =
    Object.keys(editedSystemSlugs).length > 0 ||
    Object.keys(editedServiceSlugs).length > 0;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = systems;

    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(lowerSearch),
      );
    }

    if (domainFilter && domainFilter !== "__all__") {
      result = result.filter((s) => s.domain.name === domainFilter);
    }

    result = [...result].sort((a, b) => {
      let aVal: string;
      let bVal: string;

      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "domain":
          aVal = a.domain.name.toLowerCase();
          bVal = b.domain.name.toLowerCase();
          break;
        case "language":
          aVal = (a.language ?? "").toLowerCase();
          bVal = (b.language ?? "").toLowerCase();
          break;
        case "framework":
          aVal = (a.framework ?? "").toLowerCase();
          bVal = (b.framework ?? "").toLowerCase();
          break;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [systems, search, domainFilter, sortField, sortDirection]);

  const toggleRow = useCallback((systemId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(systemId)) {
        next.delete(systemId);
      } else {
        next.add(systemId);
      }
      return next;
    });
  }, []);

  const handleSystemSlugChange = useCallback(
    (systemId: string, originalSlug: string, newSlug: string) => {
      setEditedSystemSlugs((prev) => {
        if (newSlug === originalSlug) {
          const { [systemId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [systemId]: newSlug };
      });
    },
    [],
  );

  const handleServiceSlugChange = useCallback(
    (serviceId: string, originalSlug: string, newSlug: string) => {
      setEditedServiceSlugs((prev) => {
        if (newSlug === originalSlug) {
          const { [serviceId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [serviceId]: newSlug };
      });
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    startSaveTransition(async () => {
      const result = await updateSlugsAction(workspaceSlug, {
        systemSlugs: Object.entries(editedSystemSlugs).map(([id, slug]) => ({
          id,
          slug,
        })),
        serviceSlugs: Object.entries(editedServiceSlugs).map(([id, slug]) => ({
          id,
          slug,
        })),
      });

      if (result.success) {
        toast.success("Slugs updated and dependencies reprocessed");
        setEditedSystemSlugs({});
        setEditedServiceSlugs({});
      } else {
        toast.error(result.error ?? "Failed to update slugs");
      }
    });
  }, [workspaceSlug, editedSystemSlugs, editedServiceSlugs]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className={clsx(styles.sortIcon)} size={14} />;
    }
    const Icon = sortDirection === "asc" ? ArrowUp : ArrowDown;
    return (
      <Icon
        className={clsx(styles.sortIcon, styles.sortIconActive)}
        size={14}
      />
    );
  };

  const totalColumns = 10;

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <Input
          placeholder="Search systems…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
          aria-label="Search systems"
        />
        <Select value={domainFilter} onValueChange={setDomainFilter}>
          <SelectTrigger aria-label="Filter by domain">
            <SelectValue placeholder="All domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All domains</SelectItem>
            {domains.map((d) => (
              <SelectItem key={d.id} value={d.name}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredAndSorted.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={styles.expandHead} />
              <TableHead>
                <button
                  type="button"
                  className={styles.sortButton}
                  onClick={() => handleSort("name")}
                  aria-label="Sort by name"
                >
                  Name {renderSortIcon("name")}
                </button>
              </TableHead>
              <TableHead>Alias</TableHead>
              <TableHead>
                <button
                  type="button"
                  className={styles.sortButton}
                  onClick={() => handleSort("domain")}
                  aria-label="Sort by domain"
                >
                  Domain {renderSortIcon("domain")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className={styles.sortButton}
                  onClick={() => handleSort("language")}
                  aria-label="Sort by language"
                >
                  Language {renderSortIcon("language")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className={styles.sortButton}
                  onClick={() => handleSort("framework")}
                  aria-label="Sort by framework"
                >
                  Framework {renderSortIcon("framework")}
                </button>
              </TableHead>
              <TableHead className="text-right">Services</TableHead>
              <TableHead className="text-right">Databases</TableHead>
              <TableHead className="text-right">Integrations</TableHead>
              <TableHead className="text-right">Docs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.map((system) => {
              const isExpanded = expandedRows.has(system.id);
              const hasServices = system.services.length > 0;
              const currentSystemSlug =
                editedSystemSlugs[system.id] ?? system.slug;
              const isSystemSlugDirty = system.id in editedSystemSlugs;

              return (
                <Fragment key={system.id}>
                  <TableRow
                    className={clsx(
                      styles.systemRow,
                      isExpanded && styles.systemRowExpanded,
                    )}
                    onClick={() => hasServices && toggleRow(system.id)}
                  >
                    <TableCell className={styles.expandCell}>
                      {hasServices ? (
                        isExpanded ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/w/${workspaceSlug}/systems/${system.slug}`}
                        className={styles.systemLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {system.name}
                      </Link>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={currentSystemSlug}
                        onChange={(e) =>
                          handleSystemSlugChange(
                            system.id,
                            system.slug,
                            e.target.value,
                          )
                        }
                        className={clsx(
                          styles.slugInput,
                          isSystemSlugDirty && styles.slugInputDirty,
                        )}
                        aria-label={`Alias for ${system.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{system.domain.name}</Badge>
                    </TableCell>
                    <TableCell>{system.language ?? "—"}</TableCell>
                    <TableCell>{system.framework ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {system._count.services}
                    </TableCell>
                    <TableCell className="text-right">
                      {system._count.databases}
                    </TableCell>
                    <TableCell className="text-right">
                      {system._count.integrations}
                    </TableCell>
                    <TableCell className="text-right">
                      {system._count.documents > 0 ? (
                        <Link
                          href={`/w/${workspaceSlug}/systems/${system.slug}`}
                          className={styles.docsLink}
                          onClick={(e) => e.stopPropagation()}
                          title={`${system._count.documents} document${system._count.documents === 1 ? "" : "s"}`}
                        >
                          <FileText className="size-3.5" />
                          {system._count.documents}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>

                  {isExpanded && hasServices && (
                    <TableRow className={styles.servicesRow}>
                      <TableCell
                        colSpan={totalColumns}
                        className={styles.servicesCell}
                      >
                        <div className={styles.servicesContainer}>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Service Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Alias</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {system.services.map((service) => {
                                const currentServiceSlug =
                                  editedServiceSlugs[service.id] ??
                                  service.slug;
                                const isServiceSlugDirty =
                                  service.id in editedServiceSlugs;

                                return (
                                  <TableRow
                                    key={service.id}
                                    className={styles.serviceRow}
                                  >
                                    <TableCell>{service.name}</TableCell>
                                    <TableCell>
                                      <Badge variant="secondary">
                                        {service.type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        value={currentServiceSlug}
                                        onChange={(e) =>
                                          handleServiceSlugChange(
                                            service.id,
                                            service.slug,
                                            e.target.value,
                                          )
                                        }
                                        className={clsx(
                                          styles.slugInput,
                                          isServiceSlugDirty &&
                                            styles.slugInputDirty,
                                        )}
                                        aria-label={`Alias for service ${service.name}`}
                                      />
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className={styles.emptyState}>
          {search || (domainFilter && domainFilter !== "__all__")
            ? "No systems match your filters"
            : "No systems found"}
        </div>
      )}

      {isDirty && (
        <div className={styles.confirmBar}>
          <span className={styles.changesSummary}>
            {Object.keys(editedSystemSlugs).length +
              Object.keys(editedServiceSlugs).length}{" "}
            slug(s) modified
          </span>
          <Button onClick={handleConfirm} disabled={isSaving}>
            {isSaving ? "Processing…" : "Confirm"}
          </Button>
        </div>
      )}
    </div>
  );
}
