"use client";

import { Fragment, useState, useMemo, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Layers,
  Database,
  Share2,
  FileText,
  Globe,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  Check,
  Plus,
  Box,
  ExternalLink,
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
import clsx from "clsx";

type SortField = "name" | "domain" | "language";
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
  const [editedDatadogTags, setEditedDatadogTags] = useState<
    Record<string, string>
  >({});
  const [editedDomains, setEditedDomains] = useState<
    Record<string, string>
  >({});
  const [isSaving, startSaveTransition] = useTransition();

  const isDirty =
    Object.keys(editedSystemSlugs).length > 0 ||
    Object.keys(editedServiceSlugs).length > 0 ||
    Object.keys(editedDatadogTags).length > 0 ||
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

  const handleDatadogTagChange = useCallback(
    (serviceId: string, originalTag: string, newTag: string) => {
      setEditedDatadogTags((prev) => {
        if (newTag === originalTag) {
          const rest = { ...prev };
          delete rest[serviceId];
          return rest;
        }
        return { ...prev, [serviceId]: newTag };
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
        serviceDatadogTags: Object.entries(editedDatadogTags).map(
          ([id, datadogServiceTag]) => ({
            id,
            datadogServiceTag,
          }),
        ),
        systemDomains: Object.entries(editedDomains).map(
          ([id, domainId]) => ({
            id,
            domainId,
          }),
        ),
      });

      if (result.success) {
        toast.success("Changes saved and dependencies reprocessed");
        setEditedSystemSlugs({});
        setEditedServiceSlugs({});
        setEditedDatadogTags({});
        setEditedDomains({});
      } else {
        toast.error(result.error ?? "Failed to update slugs");
      }
    });
  }, [
    workspaceSlug,
    editedSystemSlugs,
    editedServiceSlugs,
    editedDatadogTags,
    editedDomains,
  ]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="size-3.5 opacity-50" />;
    }
    const Icon = sortDirection === "asc" ? ArrowUp : ArrowDown;
    return <Icon className="size-3.5" />;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search systems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Search systems"
          />
        </div>
        <Select value={domainFilter} onValueChange={setDomainFilter}>
          <SelectTrigger
            aria-label="Filter by domain"
            className="w-auto min-w-[200px]"
          >
            <Globe className="mr-2 size-4 text-muted-foreground" />
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

      {/* Systems List */}
      {filteredAndSorted.length > 0 ? (
        <div className="border rounded-2xl overflow-hidden bg-card shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b bg-muted/30 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <div className="col-span-4">
              <button
                type="button"
                onClick={() => handleSort("name")}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                aria-label="Sort by name"
              >
                Name & Alias {renderSortIcon("name")}
              </button>
            </div>
            <div className="col-span-2">
              <button
                type="button"
                onClick={() => handleSort("domain")}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                aria-label="Sort by domain"
              >
                Domain {renderSortIcon("domain")}
              </button>
            </div>
            <div className="col-span-3 hidden md:block">
              <button
                type="button"
                onClick={() => handleSort("language")}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                aria-label="Sort by language"
              >
                Tech Stack {renderSortIcon("language")}
              </button>
            </div>
            <div className="col-span-3 flex justify-end gap-6 pr-4">
              <span>Svc</span>
              <span className="hidden md:inline">DB</span>
              <span className="hidden md:inline">Int</span>
              <span>Docs</span>
            </div>
          </div>

          {/* System Rows */}
          <div className="divide-y">
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
                  {/* Main Row */}
                  <div
                    role="row"
                    onClick={() => hasServices && toggleRow(system.id)}
                    className={clsx(
                      "grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors group",
                      hasServices && "cursor-pointer hover:bg-muted/40",
                      isExpanded && "bg-primary/5",
                    )}
                  >
                    {/* Name & Alias */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div
                        className={clsx(
                          "p-1 rounded transition-colors shrink-0",
                          hasServices
                            ? isExpanded
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                            : "invisible",
                        )}
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-3.5" />
                        ) : (
                          <ChevronRight className="size-3.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/w/${workspaceSlug}/systems/${system.slug}`}
                          className="text-sm font-semibold hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {system.name}
                        </Link>
                        <div onClick={(e) => e.stopPropagation()}>
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
                              "h-6 text-[11px] font-mono border-transparent bg-transparent px-1 mt-0.5 max-w-[14rem] shadow-none focus:border-input focus:bg-background",
                              isSystemSlugDirty &&
                                "border-primary/50 bg-primary/5",
                            )}
                            aria-label={`Alias for ${system.name}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Domain */}
                    <div
                      className="col-span-2"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                    </div>

                    {/* Tech Stack */}
                    <div className="col-span-3 hidden md:flex items-center gap-2 min-w-0">
                      {system.language ? (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium shrink-0">
                          {system.language}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                      {system.framework && (
                        <span className="text-[11px] text-muted-foreground truncate">
                          {system.framework}
                        </span>
                      )}
                    </div>

                    {/* Metrics */}
                    <div className="col-span-3 flex justify-end gap-6 pr-4">
                      <div className="flex flex-col items-center gap-1">
                        <Layers
                          className={clsx(
                            "size-3.5",
                            system._count.services > 5
                              ? "text-primary"
                              : "text-muted-foreground/50",
                          )}
                        />
                        <span className="text-xs font-mono text-muted-foreground">
                          {system._count.services}
                        </span>
                      </div>
                      <div className="hidden md:flex flex-col items-center gap-1">
                        <Database
                          className={clsx(
                            "size-3.5",
                            system._count.databases > 0
                              ? "text-emerald-500"
                              : "text-muted-foreground/50",
                          )}
                        />
                        <span className="text-xs font-mono text-muted-foreground">
                          {system._count.databases}
                        </span>
                      </div>
                      <div className="hidden md:flex flex-col items-center gap-1">
                        <Share2
                          className={clsx(
                            "size-3.5",
                            system._count.integrations > 10
                              ? "text-amber-500"
                              : "text-muted-foreground/50",
                          )}
                        />
                        <span className="text-xs font-mono text-muted-foreground">
                          {system._count.integrations}
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        {system._count.documents > 0 ? (
                          <Link
                            href={`/w/${workspaceSlug}/systems/${system.slug}`}
                            className="flex flex-col items-center gap-1 text-sky-500 hover:text-sky-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText className="size-3.5" />
                            <span className="text-xs font-mono">
                              {system._count.documents}
                            </span>
                          </Link>
                        ) : (
                          <>
                            <FileText className="size-3.5 text-muted-foreground/50" />
                            <span className="text-xs font-mono text-muted-foreground">
                              0
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Services Area */}
                  {isExpanded && hasServices && (
                    <div className="px-6 py-6 bg-muted/30 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="md:col-span-3 space-y-3">
                          <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                            <Box className="size-3" /> Services (
                            {system.services.length})
                          </div>

                          {/* Service column labels */}
                          <div className="grid grid-cols-4 gap-4 px-3 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                            <div>Service Name</div>
                            <div>Type</div>
                            <div>Alias</div>
                            <div>Datadog Tag</div>
                          </div>

                          {/* Service rows */}
                          {system.services.map((service) => {
                            const currentServiceSlug =
                              editedServiceSlugs[service.id] ?? service.slug;
                            const isServiceSlugDirty =
                              service.id in editedServiceSlugs;
                            const originalTag =
                              service.datadogServiceTag ?? service.slug;
                            const currentTag =
                              editedDatadogTags[service.id] ?? originalTag;
                            const isTagDirty =
                              service.id in editedDatadogTags;

                            return (
                              <div
                                key={service.id}
                                className="grid grid-cols-4 gap-4 items-center p-3 rounded-lg bg-card border"
                              >
                                <div className="text-sm font-medium truncate">
                                  {service.name}
                                </div>
                                <div>
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    {service.type}
                                  </Badge>
                                </div>
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
                                    "h-7 text-xs font-mono",
                                    isServiceSlugDirty &&
                                      "border-primary/50 bg-primary/5",
                                  )}
                                  aria-label={`Alias for service ${service.name}`}
                                />
                                <Input
                                  value={currentTag}
                                  onChange={(e) =>
                                    handleDatadogTagChange(
                                      service.id,
                                      originalTag,
                                      e.target.value,
                                    )
                                  }
                                  className={clsx(
                                    "h-7 text-xs font-mono",
                                    isTagDirty &&
                                      "border-primary/50 bg-primary/5",
                                  )}
                                  placeholder={service.slug}
                                  aria-label={`Datadog tag for service ${service.name}`}
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Quick links */}
                        <div className="flex flex-col justify-between items-end gap-4">
                          <div className="flex gap-2">
                            <Link
                              href={`/w/${workspaceSlug}/systems/${system.slug}`}
                              className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded-lg transition-colors border border-primary/20"
                            >
                              <ExternalLink className="size-3.5" />
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-48 text-sm text-muted-foreground border-2 border-dashed rounded-2xl">
          {search || (domainFilter && domainFilter !== "__all__")
            ? "No systems match your filters"
            : "No systems found"}
        </div>
      )}

      {/* Confirm Bar */}
      {isDirty && (
        <div className="flex items-center justify-end gap-4 pt-3 border-t">
          <span className="text-sm text-muted-foreground">
            {Object.keys(editedSystemSlugs).length +
              Object.keys(editedServiceSlugs).length +
              Object.keys(editedDatadogTags).length +
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
            "h-auto py-1 px-2 text-xs rounded-md font-normal w-full justify-between",
            isDirty
              ? "border-primary/50 bg-primary/5"
              : "border-border/50 bg-muted/50",
          )}
        >
          <span className="truncate">
            {selectedDomain?.name ?? "Select domain"}
          </span>
          <ChevronsUpDown className="ml-1 size-3 shrink-0 opacity-50" />
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
