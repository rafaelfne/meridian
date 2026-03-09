"use client";

import { useState, useTransition, useCallback } from "react";
import { createApiKey } from "@/modules/api-keys/actions/create-api-key";
import { revokeApiKey } from "@/modules/api-keys/actions/revoke-api-key";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Key, Plus, Copy, Trash2 } from "lucide-react";
import type { ApiKeyItem } from "@/modules/api-keys/types";

const EXPIRY_LABELS: Record<string, string> = {
  never: "Never",
  "30d": "30 days",
  "90d": "90 days",
  "1y": "1 year",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt) <= new Date();
}

interface ApiKeysSectionProps {
  workspaceSlug: string;
  apiKeys: ApiKeyItem[];
}

export function ApiKeysSection({
  workspaceSlug,
  apiKeys,
}: ApiKeysSectionProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [expires, setExpires] = useState("never");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isCreating, startCreateTransition] = useTransition();
  const [isRevoking, startRevokeTransition] = useTransition();

  const handleCreate = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({});
      const fd = new FormData();
      fd.set("name", name);
      fd.set("expires", expires);

      startCreateTransition(async () => {
        const result = await createApiKey(workspaceSlug, fd);
        if (result.success) {
          setCreateOpen(false);
          setName("");
          setExpires("never");
          setRevealedKey(result.data.raw);
          toast.success("API key created");
        } else {
          setErrors(result.error ?? {});
        }
      });
    },
    [name, expires, workspaceSlug],
  );

  const handleRevoke = useCallback(
    (keyId: string) => {
      const fd = new FormData();
      fd.set("keyId", keyId);

      startRevokeTransition(async () => {
        const result = await revokeApiKey(workspaceSlug, fd);
        if (result.success) {
          toast.success("API key revoked");
        } else {
          toast.error("Failed to revoke API key");
        }
      });
    },
    [workspaceSlug],
  );

  const handleCopy = useCallback(async () => {
    if (revealedKey) {
      await navigator.clipboard.writeText(revealedKey);
      toast.success("API key copied to clipboard");
    }
  }, [revealedKey]);

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Key className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">API Keys</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Create API keys for external tools to authenticate with the
                Meridian ingest endpoint.
              </p>
            </div>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="self-start sm:self-center">
                <Plus className="mr-2 size-4" />
                Create Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>
                  Generate a new API key for external integrations. The key will
                  only be shown once.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium block">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. github-actions-payments"
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm">
                      {errors.name[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium block">Expires</label>
                  <Select value={expires} onValueChange={setExpires}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EXPIRY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.expires && (
                    <p className="text-destructive text-sm">
                      {errors.expires[0]}
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating || !name.trim()}>
                    {isCreating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Keys table */}
        <div className="p-6">
          {apiKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No API keys yet. Create one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {key.keyPrefix}...
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(key.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {key.lastUsedAt ? formatDate(key.lastUsedAt) : "Never"}
                    </TableCell>
                    <TableCell>
                      {key.expiresAt ? (
                        isExpired(key.expiresAt) ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {formatDate(key.expiresAt)}
                          </span>
                        )
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Never
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isRevoking}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to revoke &ldquo;{key.name}
                              &rdquo;? Any integrations using this key will
                              immediately lose access.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevoke(key.id)}
                            >
                              Revoke
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Key reveal dialog */}
      <Dialog
        open={revealedKey !== null}
        onOpenChange={(open) => {
          if (!open) setRevealedKey(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your API Key</DialogTitle>
            <DialogDescription>
              Make sure to copy your API key now. You won&apos;t be able to see
              it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={revealedKey ?? ""}
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Store this key securely. It will not be shown again.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setRevealedKey(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
