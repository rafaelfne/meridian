"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { createFeatureAction } from "@/modules/product/actions/create-feature";
import { updateFeatureAction } from "@/modules/product/actions/update-feature";
import { deleteFeatureAction } from "@/modules/product/actions/delete-feature";
import type { FeatureItem } from "@/modules/product/types";

interface FeaturesCardProps {
  workspaceSlug: string;
  productId: string;
  features: FeatureItem[];
  allSystems: { id: string; name: string }[];
  canEdit: boolean;
}

export function FeaturesCard({
  workspaceSlug,
  productId,
  features,
  allSystems,
  canEdit,
}: FeaturesCardProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureItem | null>(null);
  const [deletingFeature, setDeletingFeature] = useState<FeatureItem | null>(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Features ({features.length})</CardTitle>
          {canEdit && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 size-3.5" />
              Add Feature
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {features.length > 0 ? (
          <div className="space-y-4">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium">{feature.name}</p>
                  {feature.description && (
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  )}
                  {feature.systems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {feature.systems.map((sys) => (
                        <Link
                          key={sys.id}
                          href={`/w/${workspaceSlug}/systems/${sys.slug}`}
                        >
                          <Badge variant="secondary" className="cursor-pointer hover:bg-accent">
                            {sys.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                {canEdit && (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setEditingFeature(feature)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => setDeletingFeature(feature)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No features defined yet.
          </p>
        )}
      </CardContent>

      {canEdit && (
        <>
          <FeatureDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            workspaceSlug={workspaceSlug}
            productId={productId}
            allSystems={allSystems}
          />

          {editingFeature && (
            <FeatureDialog
              open={!!editingFeature}
              onOpenChange={(open) => {
                if (!open) setEditingFeature(null);
              }}
              workspaceSlug={workspaceSlug}
              productId={productId}
              allSystems={allSystems}
              feature={editingFeature}
            />
          )}

          {deletingFeature && (
            <DeleteFeatureDialog
              open={!!deletingFeature}
              onOpenChange={(open) => {
                if (!open) setDeletingFeature(null);
              }}
              workspaceSlug={workspaceSlug}
              feature={deletingFeature}
            />
          )}
        </>
      )}
    </Card>
  );
}

/* ── Feature Create/Edit Dialog ─────────────────────── */

interface FeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  productId: string;
  allSystems: { id: string; name: string }[];
  feature?: FeatureItem;
}

function FeatureDialog({
  open,
  onOpenChange,
  workspaceSlug,
  productId,
  allSystems,
  feature,
}: FeatureDialogProps) {
  const router = useRouter();
  const isEdit = !!feature;
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(feature?.name ?? "");
  const [description, setDescription] = useState(feature?.description ?? "");
  const [selectedSystemIds, setSelectedSystemIds] = useState<string[]>(
    feature?.systems.map((s) => s.id) ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [systemsOpen, setSystemsOpen] = useState(false);

  const toggleSystem = useCallback((systemId: string) => {
    setSelectedSystemIds((prev) =>
      prev.includes(systemId)
        ? prev.filter((id) => id !== systemId)
        : [...prev, systemId],
    );
  }, []);

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setSelectedSystemIds([]);
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      startTransition(async () => {
        const payload = {
          name,
          description: description || undefined,
          systemIds: selectedSystemIds,
        };

        const result = isEdit
          ? await updateFeatureAction(workspaceSlug, feature!.id, payload)
          : await createFeatureAction(workspaceSlug, productId, payload);

        if (result.success) {
          if (!isEdit) resetForm();
          onOpenChange(false);
          router.refresh();
        } else {
          setError(result.error ?? "Something went wrong");
        }
      });
    },
    [name, description, selectedSystemIds, workspaceSlug, productId, feature, isEdit, onOpenChange, router, resetForm],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !isEdit) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit feature" : "Add feature"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the feature details and linked systems."
              : "Define a new feature and link it to systems."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="f-name" className="text-sm font-medium text-foreground">
              Name
            </label>
            <Input
              id="f-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="User Authentication"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="f-desc" className="text-sm font-medium text-foreground">
              Description (optional)
            </label>
            <Input
              id="f-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Handles login, registration, and session management"
            />
          </div>
          {allSystems.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Systems
              </label>
              <Popover open={systemsOpen} onOpenChange={setSystemsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={systemsOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {selectedSystemIds.length === 0
                        ? "Select systems..."
                        : `${selectedSystemIds.length} system(s) selected`}
                    </span>
                    <ChevronsUpDown className="ml-1 size-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search systems..." />
                    <CommandList>
                      <CommandEmpty>No systems found.</CommandEmpty>
                      <CommandGroup>
                        {allSystems.map((sys) => (
                          <CommandItem
                            key={sys.id}
                            value={sys.name}
                            onSelect={() => toggleSystem(sys.id)}
                          >
                            <Check
                              className={clsx(
                                "mr-2 size-3.5",
                                selectedSystemIds.includes(sys.id) ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {sys.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!isEdit) resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Delete Feature Confirmation ─────────────────────── */

interface DeleteFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  feature: FeatureItem;
}

function DeleteFeatureDialog({
  open,
  onOpenChange,
  workspaceSlug,
  feature,
}: DeleteFeatureDialogProps) {
  const router = useRouter();
  const [isDeleting, startTransition] = useTransition();

  const handleDelete = useCallback(() => {
    startTransition(async () => {
      const result = await deleteFeatureAction(workspaceSlug, feature.id);
      if (result.success) {
        toast.success("Feature deleted");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete feature");
      }
    });
  }, [workspaceSlug, feature.id, onOpenChange, router]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete feature</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;{feature.name}&rdquo;? This
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
