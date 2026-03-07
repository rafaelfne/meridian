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
import type { ProductListItem, ProductTier } from "@/modules/product/types";
import clsx from "clsx";
import styles from "./ProductsTable.module.css";

type SortField = "name" | "tier" | "systems";
type SortDirection = "asc" | "desc";

const TIER_ORDER: Record<ProductTier, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const TIER_VARIANT: Record<ProductTier, "destructive" | "default" | "secondary" | "outline"> = {
  CRITICAL: "destructive",
  HIGH: "default",
  MEDIUM: "secondary",
  LOW: "outline",
};

interface ProductsTableProps {
  products: ProductListItem[];
  workspaceSlug: string;
}

export function ProductsTable({ products, workspaceSlug }: ProductsTableProps) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("__all__");
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
    let result = products;

    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerSearch) ||
          (p.description?.toLowerCase().includes(lowerSearch) ?? false),
      );
    }

    if (tierFilter && tierFilter !== "__all__") {
      result = result.filter((p) => p.tier === tierFilter);
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
          break;
        case "tier":
          cmp = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
          break;
        case "systems":
          cmp = a._count.systems - b._count.systems;
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [products, search, tierFilter, sortField, sortDirection]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className={styles.sortIcon} size={14} />;
    }
    const Icon = sortDirection === "asc" ? ArrowUp : ArrowDown;
    return (
      <Icon className={clsx(styles.sortIcon, styles.sortIconActive)} size={14} />
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
          aria-label="Search products"
        />
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger aria-label="Filter by tier">
            <SelectValue placeholder="All tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All tiers</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredAndSorted.length > 0 ? (
        <div className={styles.tableWrapper}>
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
                <TableHead className={styles.hideOnMobile}>
                  Description
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className={styles.sortButton}
                    onClick={() => handleSort("tier")}
                    aria-label="Sort by tier"
                  >
                    Tier {renderSortIcon("tier")}
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    type="button"
                    className={styles.sortButton}
                    onClick={() => handleSort("systems")}
                    aria-label="Sort by systems count"
                  >
                    Systems {renderSortIcon("systems")}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSorted.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Link
                      href={`/w/${workspaceSlug}/products/${product.slug}`}
                      className={styles.productLink}
                    >
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className={clsx(styles.hideOnMobile, styles.descriptionCell)}>
                    {product.description ? (
                      <span className={styles.description}>
                        {product.description}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={TIER_VARIANT[product.tier]}>
                      {product.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {product._count.systems}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className={styles.emptyState}>
          {search || (tierFilter && tierFilter !== "__all__")
            ? "No products match your filters"
            : "No products found"}
        </div>
      )}
    </div>
  );
}
