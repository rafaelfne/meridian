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
  ChevronsUpDown,
  Check,
  Plus,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { SystemListItemWithServices } from "@/modules/system/types";
import { updateSlugsAction } from "@/modules/system/actions/update-slugs";
import { createDomainAction } from "@/modules/system/actions/create-domain";
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

  const [localDomains, setLocalDomains] = useState(domains);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editedSystemSlugs, setEditedSystemSlugs] = useState<
    Record<string, string>
  >({});
  const [editedServiceSlugs, setEditedServiceSlugs] = useState<
    Record<string, string>
  >({});
  const [editedDomains, setEditedDomains] = useState<
    Record<string, string>
  >({});
  const [isSaving, startSaveTransition] = useTransition();

  const isDirty =
    Object.keys(editedSystemSlugs).length > 0 ||
    Object.keys(editedServiceSlugs).length > 0 ||
    Object.keys(editedDomains).length > 0;

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
          const rest = { ...prev };
          delete rest[systemId];
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
          const rest = { ...prev };
          delete rest[serviceId];
          return rest;
        }
        return { ...prev, [serviceId]: newSlug };
      });
    },
    [],
  );

  const handleDomainChange = useCallback(
    (systemId: string, originalDomainId: string, newDomainId: string) => {
      setEditedDomains((prev) => {
        if (newDomainId === originalDomainId) {
          const rest = { ...prev };
          delete rest[systemId];
          return rest;
        }
        return { ...prev, [systemId]: newDomainId };
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
        systemDomains: Object.entries(editedDomains).map(([id, domainId]) => ({
          id,
          domainId,
        })),
      });

      if (result.success) {
        toast.success("Changes saved and dependencies reprocessed");
        setEditedSystemSlugs({});
        setEditedServiceSlugs({});
        setEditedDomains({});
      } else {
        toast.error(result.error ?? "Failed to update slugs");
      }
    });
  }, [workspaceSlug, editedSystemSlugs, editedServiceSlugs, editedDomains]);

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
            {localDomains.map((d) => (
              <SelectItem key={d.id} value={d.name}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredAndSorted.length > 0 ? (
        <div className={styles.tableWrapper}>
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
              <TableHead className={styles.hideOnMobile}>
                <button
                  type="button"
                  className={styles.sortButton}
                  onClick={() => handleSort("language")}
                  aria-label="Sort by language"
                >
                  Language {renderSortIcon("language")}
                </button>
              </TableHead>
              <TableHead className={styles.hideOnMobile}>
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
              <TableHead className={clsx("text-right", styles.hideOnMobile)}>Databases</TableHead>
              <TableHead className={clsx("text-right", styles.hideOnMobile)}>Integrations</TableHead>
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
              const currentDomainId =
                editedDomains[system.id] ?? system.domain.id;
              const isDomainDirty = system.id in editedDomains;

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
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DomainCombobox
                        domains={localDomains}
                        value={currentDomainId}
                        isDirty={isDomainDirty}
                        workspaceSlug={workspaceSlug}
                        onSelect={(domainId) =>
                          handleDomainChange(
                            system.id,
                            system.domain.id,
                            domainId,
                          )
                        }
                        onDomainCreated={(domain) =>
                          setLocalDomains((prev) =>
                            [...prev, domain].sort((a, b) =>
                              a.name.localeCompare(b.name),
                            ),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className={styles.hideOnMobile}>{system.language ?? "—"}</TableCell>
                    <TableCell className={styles.hideOnMobile}>{system.framework ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {system._count.services}
                    </TableCell>
                    <TableCell className={clsx("text-right", styles.hideOnMobile)}>
                      {system._count.databases}
                    </TableCell>
                    <TableCell className={clsx("text-right", styles.hideOnMobile)}>
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
        </div>
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
              Object.keys(editedServiceSlugs).length +
              Object.keys(editedDomains).length}{" "}
            change(s) pending
          </span>
          <Button onClick={handleConfirm} disabled={isSaving}>
            {isSaving ? "Processing…" : "Confirm"}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Domain Combobox ─────────────────────────── */

interface DomainComboboxProps {
  domains: { id: string; name: string }[];
  value: string;
  isDirty: boolean;
  workspaceSlug: string;
  onSelect: (domainId: string) => void;
  onDomainCreated: (domain: { id: string; name: string }) => void;
}

function DomainCombobox({
  domains,
  value,
  isDirty,
  workspaceSlug,
  onSelect,
  onDomainCreated,
}: DomainComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedDomain = domains.find((d) => d.id === value);

  const trimmed = query.trim();
  const exactMatch = domains.some(
    (d) => d.name.toLowerCase() === trimmed.toLowerCase(),
  );
  const showCreate = trimmed.length > 0 && !exactMatch;

  const handleCreate = async () => {
    setCreating(true);
    const result = await createDomainAction(workspaceSlug, trimmed);
    setCreating(false);

    if (result.success && result.domain) {
      onDomainCreated(result.domain);
      onSelect(result.domain.id);
      setQuery("");
      setOpen(false);
    } else {
      toast.error(result.error ?? "Failed to create domain");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={clsx(
            "w-full justify-between font-normal",
            styles.slugInput,
            isDirty && styles.slugInputDirty,
          )}
        >
          <span className="truncate">
            {selectedDomain?.name ?? "Select domain"}
          </span>
          <ChevronsUpDown className="ml-1 size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or create..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {trimmed ? "No domain found." : "Type to search..."}
            </CommandEmpty>
            <CommandGroup>
              {domains
                .filter((d) =>
                  d.name.toLowerCase().includes(trimmed.toLowerCase()),
                )
                .map((d) => (
                  <CommandItem
                    key={d.id}
                    value={d.name}
                    onSelect={() => {
                      onSelect(d.id);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={clsx(
                        "mr-2 size-3.5",
                        value === d.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {d.name}
                  </CommandItem>
                ))}
            </CommandGroup>
            {showCreate && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleCreate}
                  disabled={creating}
                  className="text-primary"
                >
                  <Plus className="mr-2 size-3.5" />
                  {creating ? "Creating..." : `Create "${trimmed}"`}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
