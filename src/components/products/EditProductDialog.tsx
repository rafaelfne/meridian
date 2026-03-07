"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import { updateProductAction } from "@/modules/product/actions/update-product";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import clsx from "clsx";
import type { ProductDetail } from "@/modules/product/types";

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  product: ProductDetail;
  systems: { id: string; name: string }[];
}

export function EditProductDialog({
  open,
  onOpenChange,
  workspaceSlug,
  product,
  systems,
}: EditProductDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [description, setDescription] = useState(product.description ?? "");
  const [tier, setTier] = useState<string>(product.tier);
  const [selectedSystemIds, setSelectedSystemIds] = useState<string[]>(
    product.systems.map((s) => s.id),
  );
  const [error, setError] = useState<string | null>(null);
  const [systemsOpen, setSystemsOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setName(product.name);
      setSlug(product.slug);
      setDescription(product.description ?? "");
      setTier(product.tier);
      setSelectedSystemIds(product.systems.map((s) => s.id));
      setError(null);
    }
  }, [open, product]);

  const toggleSystem = useCallback((systemId: string) => {
    setSelectedSystemIds((prev) =>
      prev.includes(systemId)
        ? prev.filter((id) => id !== systemId)
        : [...prev, systemId],
    );
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      startTransition(async () => {
        const result = await updateProductAction(workspaceSlug, product.id, {
          name,
          slug,
          description: description || undefined,
          tier: tier as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
          systemIds: selectedSystemIds,
        });

        if (result.success) {
          onOpenChange(false);
          router.refresh();
        } else {
          setError(result.error ?? "Failed to update product");
        }
      });
    },
    [name, slug, description, tier, selectedSystemIds, workspaceSlug, product.id, onOpenChange, router],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit product</DialogTitle>
          <DialogDescription>
            Update product details and linked systems.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="ep-name" className="text-sm font-medium text-foreground">
              Name
            </label>
            <Input
              id="ep-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="ep-slug" className="text-sm font-medium text-foreground">
              Slug
            </label>
            <Input
              id="ep-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="font-mono"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="ep-desc" className="text-sm font-medium text-foreground">
              Description (optional)
            </label>
            <Input
              id="ep-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="ep-tier" className="text-sm font-medium text-foreground">
              Tier
            </label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger id="ep-tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {systems.length > 0 && (
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
                        {systems.map((sys) => (
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
