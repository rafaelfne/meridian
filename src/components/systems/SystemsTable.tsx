"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
import type { SystemListItem } from "@/modules/system/types";
import styles from "./SystemsTable.module.css";
import clsx from "clsx";

type SortField = "name" | "domain" | "language" | "framework";
type SortDirection = "asc" | "desc";

interface SystemsTableProps {
  systems: SystemListItem[];
  domains: { id: string; name: string }[];
}

export function SystemsTable({ systems, domains }: SystemsTableProps) {
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("__all__");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

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

    // Apply search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(lowerSearch),
      );
    }

    // Apply domain filter
    if (domainFilter && domainFilter !== "__all__") {
      result = result.filter((s) => s.domain.name === domainFilter);
    }

    // Apply sorting
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
        <Select
          value={domainFilter}
          onValueChange={setDomainFilter}
        >
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.map((system) => (
              <TableRow key={system.id}>
                <TableCell>
                  <Link
                    href={`/systems/${system.slug}`}
                    className={styles.systemLink}
                  >
                    {system.name}
                  </Link>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className={styles.emptyState}>
          {search || (domainFilter && domainFilter !== "__all__")
            ? "No systems match your filters"
            : "No systems found"}
        </div>
      )}
    </div>
  );
}
