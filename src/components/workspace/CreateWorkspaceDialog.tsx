"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace } from "@/modules/workspace/actions/create-workspace";
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

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      if (!slugTouched) {
        setSlug(slugify(value));
      }
    },
    [slugTouched],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData();
      formData.set("name", name);
      formData.set("slug", slug);
      if (description) formData.set("description", description);

      startTransition(async () => {
        const result = await createWorkspace(formData);
        if (result.success) {
          onOpenChange(false);
          router.push(`/w/${result.data.slug}/dashboard`);
        } else {
          setErrors(result.error ?? {});
        }
      });
    },
    [name, slug, description, onOpenChange, router],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            A workspace groups your domains, systems, and team members.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="ws-name"
              className="text-sm font-medium text-foreground"
            >
              Name
            </label>
            <Input
              id="ws-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Workspace"
              required
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="ws-slug"
              className="text-sm font-medium text-foreground"
            >
              Slug
            </label>
            <Input
              id="ws-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="my-workspace"
              required
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="ws-desc"
              className="text-sm font-medium text-foreground"
            >
              Description (optional)
            </label>
            <Input
              id="ws-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description of this workspace"
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description[0]}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
