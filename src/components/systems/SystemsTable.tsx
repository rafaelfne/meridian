"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
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
  Save,
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

const getLanguageColor = (lang: string | null) => {
  if (!lang) return "text-muted-foreground bg-muted border-border";
  const l = lang.toLowerCase();
  if (l.includes("typescript") || l.includes("javascript") || l.includes("js"))
    return "text-blue-400 bg-blue-400/10 border-blue-400/20";
  if (l.includes("c#") || l.includes("csharp"))
    return "text-violet-400 bg-violet-400/10 border-violet-400/20";
  if (l.includes("java"))
    return "text-amber-400 bg-amber-400/10 border-amber-400/20";
  if (l.includes("go"))
    return "text-cyan-400 bg-cyan-400/10 border-cyan-400/20";
  if (l.includes("python"))
    return "text-green-400 bg-green-400/10 border-green-400/20";
  if (l.includes("rust"))
    return "text-orange-400 bg-orange-400/10 border-orange-400/20";
  return "text-primary bg-primary/10 border-primary/20";
};

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

  const changeCount =
    Object.keys(editedSystemSlugs).length +
    Object.keys(editedServiceSlugs).length +
    Object.keys(editedDatadogTags).length +
    Object.keys(editedDomains).length;

  const isDirty = changeCount > 0;

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
      return <ArrowUpDown className="size-3 opacity-50" />;
    }
    const Icon = sortDirection === "asc" ? ArrowUp : ArrowDown;
    return <Icon className="size-3" />;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Systems</h1>
          <p className="text-sm text-muted-foreground font-medium">
            Manage and edit systems in your inventory
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search systems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full md:w-64"
              aria-label="Search systems"
            />
          </div>
          <Button
            onClick={handleConfirm}
            disabled={!isDirty || isSaving}
            className="shadow-lg shrink-0"
          >
            <Save className="size-4" />
            {isSaving
              ? "Processing\u2026"
              : isDirty
                ? "Confirm"
                : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
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
          {isDirty && (
            <span className="text-sm text-muted-foreground">
              {changeCount} change(s) pending
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <span className="mr-2">Sort:</span>
          {(["name", "domain", "language"] as const).map((field) => (
            <button
              key={field}
              type="button"
              onClick={() => handleSort(field)}
              className={clsx(
                "inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors",
                sortField === field
                  ? "bg-primary/10 text-primary"
                  : "hover:text-foreground",
              )}
              aria-label={`Sort by ${field}`}
            >
              {field === "name"
                ? "Name"
                : field === "domain"
                  ? "Domain"
                  : "Language"}
              {renderSortIcon(field)}
            </button>
          ))}
        </div>
      </div>

      {/* System Cards */}
      {filteredAndSorted.length > 0 ? (
        <div className="space-y-4">
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
              <div
                key={system.id}
                className={clsx(
                  "group border rounded-2xl transition-all duration-300",
                  isExpanded
                    ? "bg-card border-primary/30 shadow-xl"
                    : "bg-card/50 border-border hover:border-border/80",
                )}
              >
                {/* Card Header */}
                <div
                  role="row"
                  onClick={() => hasServices && toggleRow(system.id)}
                  className={clsx(
                    "p-5 flex flex-col md:flex-row md:items-center gap-6",
                    hasServices && "cursor-pointer",
                  )}
                >
                  {/* Toggle + Name + Alias */}
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={clsx(
                        "p-2 rounded-xl transition-colors shrink-0",
                        hasServices
                          ? isExpanded
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                          : "invisible",
                      )}
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-[200px]">
                      <Link
                        href={`/w/${workspaceSlug}/systems/${system.slug}`}
                        className="font-bold hover:text-primary transition-colors leading-none"
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
                            "h-6 text-[11px] font-mono border-transparent bg-transparent px-1 max-w-[240px] shadow-none focus:border-input focus:bg-background",
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
                    className="w-full md:w-48 space-y-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1">
                      Domain
                    </label>
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
                  <div className="hidden lg:flex flex-col gap-1 w-40">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1">
                      Tech Stack
                    </span>
                    <div className="flex items-center gap-2">
                      {system.language ? (
                        <div
                          className={clsx(
                            "px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase shrink-0",
                            getLanguageColor(system.language),
                          )}
                        >
                          {system.language}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{"\u2014"}</span>
                      )}
                      {system.framework && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {system.framework}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-5 bg-muted/30 p-2 rounded-xl border border-border/50">
                    <div className="flex flex-col items-center gap-0.5 px-2">
                      <Layers
                        className={clsx(
                          "size-3.5",
                          system._count.services > 0
                            ? "text-primary"
                            : "text-muted-foreground/50",
                        )}
                      />
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {system._count.services}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 px-2 border-l border-border/50">
                      <Database
                        className={clsx(
                          "size-3.5",
                          system._count.databases > 0
                            ? "text-emerald-500"
                            : "text-muted-foreground/50",
                        )}
                      />
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {system._count.databases}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 px-2 border-l border-border/50">
                      <Share2
                        className={clsx(
                          "size-3.5",
                          system._count.integrations > 0
                            ? "text-amber-500"
                            : "text-muted-foreground/50",
                        )}
                      />
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {system._count.integrations}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 px-2 border-l border-border/50">
                      {system._count.documents > 0 ? (
                        <Link
                          href={`/w/${workspaceSlug}/systems/${system.slug}`}
                          className="flex flex-col items-center gap-0.5 text-sky-500 hover:text-sky-400 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="size-3.5" />
                          <span className="text-[10px] font-bold">
                            {system._count.documents}
                          </span>
                        </Link>
                      ) : (
                        <>
                          <FileText className="size-3.5 text-muted-foreground/50" />
                          <span className="text-[10px] font-bold text-muted-foreground">
                            0
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Services Area */}
                {isExpanded && hasServices && (
                  <div className="border-t bg-muted/20 p-6">
                    <div className="space-y-4">
                      {/* Services Header */}
                      <div className="flex items-center justify-between border-b border-border/50 pb-4">
                        <div className="flex items-center gap-2">
                          <Box className="size-4 text-primary" />
                          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                            Services ({system.services.length})
                          </h4>
                        </div>
                        <Link
                          href={`/w/${workspaceSlug}/systems/${system.slug}`}
                          className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded-lg transition-colors border border-primary/20"
                        >
                          <ExternalLink className="size-3.5" />
                          View Details
                        </Link>
                      </div>

                      {/* Service Cards */}
                      <div className="grid gap-4">
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
                              className="bg-card border rounded-2xl p-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-end"
                            >
                              <div className="md:col-span-3 space-y-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                  Service Name
                                </label>
                                <div
                                  className="text-xs font-semibold truncate"
                                  title={service.name}
                                >
                                  {service.name}
                                </div>
                              </div>

                              <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                  Type
                                </label>
                                <div>
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] font-bold"
                                  >
                                    {service.type}
                                  </Badge>
                                </div>
                              </div>

                              <div className="md:col-span-3 space-y-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                  Alias
                                </label>
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
                              </div>

                              <div className="md:col-span-4 space-y-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                  Datadog Tag
                                </label>
                                <div className="flex items-center gap-2">
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
                                      "h-7 text-xs font-mono text-emerald-500",
                                      isTagDirty &&
                                        "border-primary/50 bg-primary/5",
                                    )}
                                    placeholder={service.slug}
                                    aria-label={`Datadog tag for service ${service.name}`}
                                  />
                                  <div className="p-1.5 bg-muted rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors border">
                                    <ExternalLink className="size-3.5" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer */}
                      <div className="pt-4 flex items-center justify-end border-t border-border/30">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ID: {system.id}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-48 text-sm text-muted-foreground border-2 border-dashed rounded-2xl">
          {search || (domainFilter && domainFilter !== "__all__")
            ? "No systems match your filters"
            : "No systems found"}
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-4">
        <span>
          Systems: {filteredAndSorted.length}/{systems.length}
        </span>
      </div>
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
