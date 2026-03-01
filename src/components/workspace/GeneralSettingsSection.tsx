"use client";

import { useState, useTransition, useCallback } from "react";
import { updateWorkspace } from "@/modules/workspace/actions/update-workspace";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GeneralSettingsSectionProps {
  workspace: {
    name: string;
    slug: string;
    description: string | null;
  };
  workspaceSlug: string;
}

export function GeneralSettingsSection({
  workspace,
  workspaceSlug,
}: GeneralSettingsSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description ?? "");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saved, setSaved] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSaved(false);
      const formData = new FormData();
      formData.set("name", name);
      if (description) formData.set("description", description);

      startTransition(async () => {
        const result = await updateWorkspace(workspaceSlug, formData);
        if (result.success) {
          setErrors({});
          setSaved(true);
        } else {
          setErrors(result.error ?? {});
        }
      });
    },
    [name, description, workspaceSlug],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>
          Update your workspace name and description.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label
              htmlFor="settings-name"
              className="text-sm font-medium text-foreground"
            >
              Name
            </label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="settings-slug"
              className="text-sm font-medium text-muted-foreground"
            >
              Slug
            </label>
            <Input id="settings-slug" value={workspace.slug} disabled />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="settings-desc"
              className="text-sm font-medium text-foreground"
            >
              Description
            </label>
            <Input
              id="settings-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description"
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description[0]}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
            {saved && (
              <span className="text-sm text-muted-foreground">Saved</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
