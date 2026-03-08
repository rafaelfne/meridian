"use client";

import { useState, useTransition, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { saveStatusPageConfig } from "@/modules/status-page/actions/save-status-page-config";
import type {
  StatusPageSettingsProps,
  StatusPageProductItem,
  StatusPageFeatureItem,
  StatusPageConfigData,
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

export function StatusPageSection({
  workspaceSlug,
  workspaceName,
  config,
  availableProducts,
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
      });
      if (result.success) {
        toast.success("Status page settings saved");
      } else {
        toast.error(result.error ?? "Failed to save");
      }
    });
  }, [enabled, slug, items, workspaceSlug]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Status Page</CardTitle>
            <CardDescription>
              Configure your public status page visibility and product names.
            </CardDescription>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-end gap-4 justify-between">
          <div className="space-y-2">
            <label
              htmlFor="status-page-slug"
              className="text-sm font-medium text-foreground"
            >
              Slug
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                /status/
              </span>
              <Input
                id="status-page-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="your-workspace"
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(`/status/${slug}`, "_blank")
            }
            disabled={!slug}
          >
            <ExternalLink className="mr-2 size-4" />
            Preview
          </Button>
        </div>

        {items.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Products</h3>
            {items.map((product) => {
              const isExpanded = expandedProducts.has(product.productId);
              return (
                <div
                  key={product.productId}
                  className="rounded-md border p-4"
                >
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleExpand(product.productId)}
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                      {product.publicName}
                    </button>
                    <Switch
                      checked={product.visible}
                      onCheckedChange={(checked) =>
                        updateProduct(product.productId, { visible: checked })
                      }
                    />
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-4 pl-6">
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
        )}

        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No products found. Create products first to configure the status
            page.
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
