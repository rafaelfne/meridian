"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import { createProductAction } from "@/modules/product/actions/create-product";
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

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  systems: { id: string; name: string }[];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function CreateProductDialog({
  open,
  onOpenChange,
  workspaceSlug,
  systems,
}: CreateProductDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState("MEDIUM");
  const [selectedSystemIds, setSelectedSystemIds] = useState<string[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemsOpen, setSystemsOpen] = useState(false);

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      if (!slugTouched) {
        setSlug(slugify(value));
      }
    },
    [slugTouched],
  );

  const toggleSystem = useCallback((systemId: string) => {
    setSelectedSystemIds((prev) =>
      prev.includes(systemId)
        ? prev.filter((id) => id !== systemId)
        : [...prev, systemId],
    );
  }, []);

  const resetForm = useCallback(() => {
    setName("");
    setSlug("");
    setDescription("");
    setTier("MEDIUM");
    setSelectedSystemIds([]);
    setSlugTouched(false);
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      startTransition(async () => {
        const result = await createProductAction(workspaceSlug, {
          name,
          slug,
          description: description || undefined,
          tier: tier as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
          systemIds: selectedSystemIds,
        });

        if (result.success && result.product) {
          resetForm();
          onOpenChange(false);
          router.push(`/w/${workspaceSlug}/products/${result.product.slug}`);
        } else {
          setError(result.error ?? "Failed to create product");
        }
      });
    },
    [name, slug, description, tier, selectedSystemIds, workspaceSlug, onOpenChange, router, resetForm],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create product</DialogTitle>
          <DialogDescription>
            Group systems under a business-facing product.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="p-name" className="text-sm font-medium text-foreground">
              Name
            </label>
            <Input
              id="p-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Payment Gateway"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="p-slug" className="text-sm font-medium text-foreground">
              Slug
            </label>
            <Input
              id="p-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="payment-gateway"
              className="font-mono"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="p-desc" className="text-sm font-medium text-foreground">
              Description (optional)
            </label>
            <Input
              id="p-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Handles all payment processing flows"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="p-tier" className="text-sm font-medium text-foreground">
              Tier
            </label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger id="p-tier">
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
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
