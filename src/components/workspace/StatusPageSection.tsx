"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Upload,
  X,
  Settings,
  Globe,
  Palette,
  Package,
  Eye,
  Info,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { saveStatusPageConfig } from "@/modules/status-page/actions/save-status-page-config";
import { setStatusOverride } from "@/modules/status-page/actions/set-status-override";
import { resolveStatusOverride } from "@/modules/status-page/actions/resolve-status-override";
import type {
  StatusPageSettingsProps,
  StatusPageProductItem,
  StatusPageFeatureItem,
  StatusPageConfigData,
  StatusOverrideItem,
} from "@/modules/status-page/types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildInitialItems(
  config: StatusPageConfigData | null,
  availableProducts: StatusPageSettingsProps["availableProducts"],
): StatusPageProductItem[] {
  if (!config) {
    return availableProducts.map((p) => ({
      productId: p.id,
      publicName: p.name,
      visible: true,
      features: p.features.map((f) => ({
        featureId: f.id,
        publicName: f.name,
        visible: true,
      })),
    }));
  }

  const configMap = new Map(config.items.map((i) => [i.productId, i]));
  const merged: StatusPageProductItem[] = [];

  for (const item of config.items) {
    const available = availableProducts.find((p) => p.id === item.productId);
    if (!available) continue;

    const configFeatureMap = new Map(
      item.features.map((f) => [f.featureId, f]),
    );
    const mergedFeatures: StatusPageFeatureItem[] = [];

    for (const cf of item.features) {
      if (available.features.some((f) => f.id === cf.featureId)) {
        mergedFeatures.push(cf);
      }
    }
    for (const af of available.features) {
      if (!configFeatureMap.has(af.id)) {
        mergedFeatures.push({
          featureId: af.id,
          publicName: af.name,
          visible: false,
        });
      }
    }

    merged.push({ ...item, features: mergedFeatures });
  }

  for (const p of availableProducts) {
    if (!configMap.has(p.id)) {
      merged.push({
        productId: p.id,
        publicName: p.name,
        visible: false,
        features: p.features.map((f) => ({
          featureId: f.id,
          publicName: f.name,
          visible: false,
        })),
      });
    }
  }

  return merged;
}

function handleImageUpload(
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (url: string | null) => void,
) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    toast.error("Image must be under 2 MB");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => setter(reader.result as string);
  reader.readAsDataURL(file);
}

function StatusPagePreview({
  pageTitle,
  logoUrl,
  primaryColor,
  hidePoweredBy,
  items,
  workspaceName,
}: {
  pageTitle: string;
  logoUrl: string | null;
  primaryColor: string;
  hidePoweredBy: boolean;
  items: StatusPageProductItem[];
  workspaceName: string;
}) {
  const visibleProducts = items.filter((p) => p.visible);
  const color = primaryColor || "#10b981";

  return (
    <Card className="overflow-hidden flex flex-col aspect-[9/12]">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-6 w-auto" />
          ) : (
            <div className="size-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
              <div className="size-3.5 rounded-sm" style={{ backgroundColor: color }} />
            </div>
          )}
          <span className="text-sm font-bold tracking-tight">
            {pageTitle || `${workspaceName} Status`}
          </span>
        </div>
        <div className="h-2 w-16 bg-muted rounded-full" />
      </div>

      {/* Content */}
      <div className="p-5 flex-1">
        {/* Overall status banner */}
        <div
          className="p-3 rounded-lg border mb-6"
          style={{ borderColor: `${color}40`, backgroundColor: `${color}10` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="size-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}80` }}
            />
            <span className="text-xs font-medium" style={{ color }}>
              All systems operational
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">Updated 2 minutes ago</p>
        </div>

        {/* Products */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2">
            Services
          </p>
          {visibleProducts.length > 0 ? (
            <div className="space-y-0">
              {visibleProducts.map((p) => (
                <div
                  key={p.productId}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="text-xs text-muted-foreground">{p.publicName}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium" style={{ color }}>
                      Operational
                    </span>
                    <CheckCircle2 className="size-3" style={{ color }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center border-2 border-dashed rounded-lg">
              <p className="text-[10px] text-muted-foreground italic">No visible products</p>
            </div>
          )}
        </div>

        {/* Mock uptime bars */}
        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2">
            Uptime (90 days)
          </p>
          <div className="flex gap-[2px] h-5">
            {Array.from({ length: 45 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  backgroundColor: i === 32 ? "#f59e0b" : `${color}60`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      {!hidePoweredBy && (
        <div className="p-3 text-center border-t bg-muted/20">
          <p className="text-[10px] text-muted-foreground">
            Powered by <span className="font-medium">Meridian</span>
          </p>
        </div>
      )}
    </Card>
  );
}

export function StatusPageSection({
  workspaceSlug,
  workspaceName,
  config,
  availableProducts,
  overrides,
}: StatusPageSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(config?.enabled ?? false);
  const [slug, setSlug] = useState(config?.slug ?? slugify(workspaceName));
  const [items, setItems] = useState<StatusPageProductItem[]>(() =>
    buildInitialItems(config, availableProducts),
  );
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
    new Set(),
  );

  // Override form state
  const [overrideTarget, setOverrideTarget] = useState("");
  const [overrideStatus, setOverrideStatus] = useState<string>("");
  const [overrideMessage, setOverrideMessage] = useState("");
  const [isOverridePending, startOverrideTransition] = useTransition();
  const [showResolvedOverrides, setShowResolvedOverrides] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string | null>(
    config?.whiteLabel.logoUrl ?? null,
  );
  const [faviconUrl, setFaviconUrl] = useState<string | null>(
    config?.whiteLabel.faviconUrl ?? null,
  );
  const [primaryColor, setPrimaryColor] = useState(
    config?.whiteLabel.primaryColor ?? "",
  );
  const [pageTitle, setPageTitle] = useState(
    config?.whiteLabel.pageTitle ?? "",
  );
  const [hidePoweredBy, setHidePoweredBy] = useState(
    config?.whiteLabel.hidePoweredBy ?? false,
  );

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const toggleExpand = useCallback((productId: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const updateProduct = useCallback(
    (productId: string, update: Partial<StatusPageProductItem>) => {
      setItems((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, ...update } : item,
        ),
      );
    },
    [],
  );

  const updateFeature = useCallback(
    (
      productId: string,
      featureId: string,
      update: Partial<StatusPageFeatureItem>,
    ) => {
      setItems((prev) =>
        prev.map((item) =>
          item.productId === productId
            ? {
                ...item,
                features: item.features.map((f) =>
                  f.featureId === featureId ? { ...f, ...update } : f,
                ),
              }
            : item,
        ),
      );
    },
    [],
  );

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveStatusPageConfig(workspaceSlug, {
        enabled,
        slug,
        items,
        whiteLabel: {
          logoUrl,
          faviconUrl,
          primaryColor: primaryColor || null,
          pageTitle: pageTitle || null,
          hidePoweredBy,
        },
      });
      if (result.success) {
        toast.success("Status page settings saved");
      } else {
        toast.error(result.error ?? "Failed to save");
      }
    });
  }, [
    enabled,
    slug,
    items,
    logoUrl,
    faviconUrl,
    primaryColor,
    pageTitle,
    hidePoweredBy,
    workspaceSlug,
  ]);

  const handleSetOverride = useCallback(() => {
    if (!overrideTarget || !overrideStatus) return;
    const [targetType, targetId] = overrideTarget.split(":") as [
      "product" | "feature",
      string,
    ];
    startOverrideTransition(async () => {
      const result = await setStatusOverride(workspaceSlug, {
        targetType,
        targetId,
        status: overrideStatus as "investigating" | "identified" | "monitoring",
        message: overrideMessage || undefined,
      });
      if (result.success) {
        toast.success("Status override applied");
        setOverrideTarget("");
        setOverrideStatus("");
        setOverrideMessage("");
      } else {
        toast.error(result.error ?? "Failed to set override");
      }
    });
  }, [overrideTarget, overrideStatus, overrideMessage, workspaceSlug]);

  const handleResolveOverride = useCallback(
    (overrideId: string) => {
      startOverrideTransition(async () => {
        const result = await resolveStatusOverride(workspaceSlug, {
          overrideId,
        });
        if (result.success) {
          toast.success("Override resolved");
        } else {
          toast.error(result.error ?? "Failed to resolve override");
        }
      });
    },
    [workspaceSlug],
  );

  const activeOverrides = overrides.filter(
    (o) => o.status !== "resolved" && !o.isExpired,
  );
  const resolvedOverrides = overrides.filter(
    (o) => o.status === "resolved" || o.isExpired,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left column — Settings */}
      <div className="lg:col-span-7 space-y-6">
        {/* Header & toggle */}
        <Card>
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="size-5 text-primary" />
                Status Page
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure your public status page visibility and product names.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </Card>

        <div
          className={`transition-opacity space-y-6 ${!enabled ? "opacity-50 pointer-events-none" : ""}`}
        >
          {/* Status Overrides */}
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Shield className="size-3.5" /> Status Overrides
              </h3>
              {activeOverrides.length > 0 && (
                <Badge variant="destructive">
                  {activeOverrides.length} Active
                </Badge>
              )}
            </div>
            <CardContent className="p-6 space-y-6">
              {/* Active overrides */}
              {activeOverrides.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium block">
                    Active Overrides
                  </label>
                  <div className="space-y-2">
                    {activeOverrides.map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between gap-3 rounded-lg border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {o.targetName}
                            </span>
                            <Badge
                              variant={
                                o.status === "monitoring"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {o.status}
                            </Badge>
                          </div>
                          {o.message && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {o.message}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="size-2.5" />
                            Expires{" "}
                            {new Date(o.expiresAt).toLocaleString()}
                            {o.setByName && (
                              <span> &middot; Set by {o.setByName}</span>
                            )}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveOverride(o.id)}
                          disabled={isOverridePending}
                        >
                          Resolve
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  No active overrides
                </div>
              )}

              {/* Set override form */}
              <div className="space-y-3 border-t pt-4">
                <label className="text-sm font-medium block">
                  Set Override
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={overrideTarget}
                    onValueChange={setOverrideTarget}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      {items
                        .filter((p) => p.visible)
                        .map((p) => (
                          <SelectGroup key={p.productId}>
                            <SelectLabel>{p.publicName}</SelectLabel>
                            <SelectItem value={`product:${p.productId}`}>
                              {p.publicName} (Product)
                            </SelectItem>
                            {p.features
                              .filter((f) => f.visible)
                              .map((f) => (
                                <SelectItem
                                  key={f.featureId}
                                  value={`feature:${f.featureId}`}
                                >
                                  {f.publicName}
                                </SelectItem>
                              ))}
                          </SelectGroup>
                        ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={overrideStatus}
                    onValueChange={setOverrideStatus}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="investigating">
                        Investigating
                      </SelectItem>
                      <SelectItem value="identified">Identified</SelectItem>
                      <SelectItem value="monitoring">Monitoring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Input
                  value={overrideMessage}
                  onChange={(e) => setOverrideMessage(e.target.value)}
                  placeholder="Public message (optional, max 500 chars)"
                  maxLength={500}
                />

                <Button
                  onClick={handleSetOverride}
                  disabled={
                    !overrideTarget ||
                    !overrideStatus ||
                    isOverridePending
                  }
                  size="sm"
                >
                  <AlertTriangle className="size-3.5 mr-1.5" />
                  {isOverridePending ? "Setting..." : "Set Override"}
                </Button>
              </div>

              {/* Resolved / expired overrides */}
              {resolvedOverrides.length > 0 && (
                <div className="border-t pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      setShowResolvedOverrides((prev) => !prev)
                    }
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showResolvedOverrides ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                    {resolvedOverrides.length} resolved / expired
                  </button>
                  {showResolvedOverrides && (
                    <div className="mt-3 space-y-2">
                      {resolvedOverrides.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-dashed p-3 opacity-60"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium truncate">
                                {o.targetName}
                              </span>
                              <Badge variant="outline">
                                {o.isExpired ? "expired" : o.status}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(o.createdAt).toLocaleString()}
                              {o.setByName && ` by ${o.setByName}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* General Settings */}
          <Card>
            <div className="p-4 border-b">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Globe className="size-3.5" /> General Settings
              </h3>
            </div>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  URL Slug
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-ring transition-colors">
                    <span className="px-3 py-2 text-muted-foreground border-r bg-muted/50 text-sm whitespace-nowrap">
                      /status/
                    </span>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="your-workspace"
                      className="border-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/status/${slug}`, "_blank")}
                    disabled={!slug}
                    className="shrink-0"
                  >
                    <ExternalLink className="mr-2 size-4" />
                    Preview
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Page Title
                </label>
                <Input
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="e.g. Warren Status"
                />
              </div>
            </CardContent>
          </Card>

          {/* Branding & Identity */}
          <Card>
            <div className="p-4 border-b">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Palette className="size-3.5" /> Branding & Identity
              </h3>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Logo</label>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/svg+xml"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setLogoUrl)}
                  />
                  {logoUrl ? (
                    <div className="flex items-center gap-2 p-3 border rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoUrl}
                        alt="Logo preview"
                        className="h-10 w-auto rounded bg-white p-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLogoUrl(null)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed rounded-xl p-4 hover:border-primary/50 transition-colors cursor-pointer group"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Upload className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        <p className="text-xs text-muted-foreground">
                          PNG or SVG, max 2 MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Favicon */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Favicon
                  </label>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/png,image/svg+xml,image/x-icon"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setFaviconUrl)}
                  />
                  {faviconUrl ? (
                    <div className="flex items-center gap-2 p-3 border rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={faviconUrl}
                        alt="Favicon preview"
                        className="size-8 rounded bg-white p-0.5"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFaviconUrl(null)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed rounded-xl p-4 hover:border-primary/50 transition-colors cursor-pointer group"
                      onClick={() => faviconInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Upload className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        <p className="text-xs text-muted-foreground">
                          PNG, SVG, or ICO, max 2 MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Primary color */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor || "#10b981"}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="size-10 cursor-pointer rounded bg-transparent border-none"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#10b981"
                    className="max-w-28 font-mono"
                  />
                </div>
              </div>

              {/* Hide footer toggle */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Switch
                  checked={hidePoweredBy}
                  onCheckedChange={setHidePoweredBy}
                />
                <label className="text-sm text-muted-foreground">
                  Hide &quot;Powered by Meridian&quot; footer
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Product Visibility */}
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Package className="size-3.5" /> Product Visibility
              </h3>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                {items.filter((p) => p.visible).length} Active
              </span>
            </div>
            {items.length > 0 ? (
              <div className="divide-y">
                {items.map((product) => {
                  const isExpanded = expandedProducts.has(product.productId);
                  return (
                    <div key={product.productId}>
                      <div className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors group">
                        <button
                          type="button"
                          onClick={() => toggleExpand(product.productId)}
                          className="flex items-center gap-3"
                        >
                          {isExpanded ? (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                          )}
                          <span
                            className={`text-sm ${product.visible ? "" : "text-muted-foreground italic"}`}
                          >
                            {product.publicName}
                          </span>
                        </button>
                        <Switch
                          checked={product.visible}
                          onCheckedChange={(checked) =>
                            updateProduct(product.productId, {
                              visible: checked,
                            })
                          }
                        />
                      </div>

                      {isExpanded && (
                        <div className="px-6 pb-4 space-y-3">
                          <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">
                              Public name
                            </label>
                            <Input
                              value={product.publicName}
                              onChange={(e) =>
                                updateProduct(product.productId, {
                                  publicName: e.target.value,
                                })
                              }
                            />
                          </div>

                          {product.features.length > 0 && (
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">
                                Features
                              </label>
                              <div className="space-y-2">
                                {product.features.map((feature) => (
                                  <div
                                    key={feature.featureId}
                                    className="flex items-center gap-3 rounded border p-3"
                                  >
                                    <Switch
                                      checked={feature.visible}
                                      onCheckedChange={(checked) =>
                                        updateFeature(
                                          product.productId,
                                          feature.featureId,
                                          { visible: checked },
                                        )
                                      }
                                    />
                                    <Input
                                      value={feature.publicName}
                                      onChange={(e) =>
                                        updateFeature(
                                          product.productId,
                                          feature.featureId,
                                          { publicName: e.target.value },
                                        )
                                      }
                                      className="flex-1"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6">
                <p className="text-sm text-muted-foreground">
                  No products found. Create products first to configure the
                  status page.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Save actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Right column — Live Preview */}
      <div className="lg:col-span-5">
        <div className="sticky top-12">
          <div className="flex items-center gap-2 mb-4 text-muted-foreground text-xs font-medium uppercase tracking-widest px-2">
            <Eye className="size-3.5" /> Live Preview
          </div>

          <StatusPagePreview
            pageTitle={pageTitle}
            logoUrl={logoUrl}
            primaryColor={primaryColor}
            hidePoweredBy={hidePoweredBy}
            items={items}
            workspaceName={workspaceName}
          />

          <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex gap-3">
            <Info className="size-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-primary/80 leading-relaxed">
              Saved changes will be applied instantly to your public status
              page. Make sure to validate the URL slug.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
