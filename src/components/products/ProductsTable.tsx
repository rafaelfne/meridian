"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  ShieldAlert,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ProductListItem, ProductTier } from "@/modules/product/types";
import clsx from "clsx";

type SortField = "name" | "tier" | "systems";
type SortDirection = "asc" | "desc";

const TIER_ORDER: Record<ProductTier, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const TIER_VARIANT: Record<
  ProductTier,
  "destructive" | "default" | "secondary" | "outline"
> = {
  CRITICAL: "destructive",
  HIGH: "default",
  MEDIUM: "secondary",
  LOW: "outline",
};

const getTierColor = (tier: ProductTier) => {
  switch (tier) {
    case "CRITICAL":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    case "HIGH":
      return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    case "MEDIUM":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case "LOW":
      return "text-slate-400 bg-slate-400/10 border-slate-400/20";
  }
};

interface ProductsTableProps {
  products: ProductListItem[];
  workspaceSlug: string;
  createButton?: React.ReactNode;
}

export function ProductsTable({
  products,
  workspaceSlug,
  createButton,
}: ProductsTableProps) {
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
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground font-medium">
            Organize systems under business-facing products
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full md:w-64"
              aria-label="Search products"
            />
          </div>
          {createButton && <div className="shrink-0">{createButton}</div>}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger
            aria-label="Filter by tier"
            className="w-auto min-w-[200px]"
          >
            <ShieldAlert className="mr-2 size-4 text-muted-foreground" />
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

        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <span className="mr-2">Sort:</span>
          {(["name", "tier", "systems"] as const).map((field) => (
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
              aria-label={`Sort by ${field === "systems" ? "systems count" : field}`}
            >
              {field === "name"
                ? "Name"
                : field === "tier"
                  ? "Tier"
                  : "Systems"}
              {renderSortIcon(field)}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards */}
      {filteredAndSorted.length > 0 ? (
        <div className="space-y-4">
          {filteredAndSorted.map((product) => (
            <Link
              key={product.id}
              href={`/w/${workspaceSlug}/products/${product.slug}`}
              className="block group"
            >
              <div className="border rounded-2xl bg-card/50 border-border hover:border-border/80 hover:bg-card transition-all duration-300 p-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                {/* Icon + Name + Description */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="p-2 rounded-xl bg-muted text-muted-foreground shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Package className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold group-hover:text-primary transition-colors leading-none">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tier */}
                <div className="flex flex-col gap-1 shrink-0">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1 hidden md:block">
                    Tier
                  </span>
                  <div
                    className={clsx(
                      "px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase w-fit",
                      getTierColor(product.tier),
                    )}
                  >
                    {product.tier}
                  </div>
                </div>

                {/* Systems count */}
                <div className="flex items-center gap-5 bg-muted/30 p-2 rounded-xl border border-border/50 shrink-0">
                  <div className="flex flex-col items-center gap-0.5 px-2">
                    <Layers
                      className={clsx(
                        "size-3.5",
                        product._count.systems > 0
                          ? "text-primary"
                          : "text-muted-foreground/50",
                      )}
                    />
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {product._count.systems}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-48 text-sm text-muted-foreground border-2 border-dashed rounded-2xl">
          {search || (tierFilter && tierFilter !== "__all__")
            ? "No products match your filters"
            : "No products found"}
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-4">
        <span>
          Products: {filteredAndSorted.length}/{products.length}
        </span>
      </div>
    </div>
  );
}
