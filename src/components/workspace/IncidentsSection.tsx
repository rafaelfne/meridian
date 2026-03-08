"use client";

import { useState, useTransition, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { setStatusOverride } from "@/modules/status-page/actions/set-status-override";
import { resolveStatusOverride } from "@/modules/status-page/actions/resolve-status-override";
import type {
  IncidentsSectionProps,
  StatusOverrideItem,
} from "@/modules/status-page/types";

function timeAgoShort(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function IncidentsSection({
  workspaceSlug,
  availableProducts,
  overrides,
}: IncidentsSectionProps) {
  // Declare form state
  const [target, setTarget] = useState("");
  const [status, setStatus] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  // Update dialog state
  const [editingIncident, setEditingIncident] =
    useState<StatusOverrideItem | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editMessage, setEditMessage] = useState("");

  // History toggle
  const [showHistory, setShowHistory] = useState(false);

  const activeIncidents = overrides.filter(
    (o) => o.status !== "resolved" && !o.isExpired,
  );
  const resolvedIncidents = overrides.filter(
    (o) => o.status === "resolved" || o.isExpired,
  );

  const handleDeclare = useCallback(() => {
    if (!target || !status) return;
    const [targetType, targetId] = target.split(":") as [
      "product" | "feature",
      string,
    ];
    startTransition(async () => {
      const result = await setStatusOverride(workspaceSlug, {
        targetType,
        targetId,
        status: status as "investigating" | "identified" | "monitoring",
        message: message || undefined,
      });
      if (result.success) {
        toast.success("Incident declared");
        setTarget("");
        setStatus("");
        setMessage("");
      } else {
        toast.error(result.error ?? "Failed to declare incident");
      }
    });
  }, [target, status, message, workspaceSlug]);

  const handleResolve = useCallback(
    (overrideId: string) => {
      startTransition(async () => {
        const result = await resolveStatusOverride(workspaceSlug, {
          overrideId,
        });
        if (result.success) {
          toast.success("Incident resolved");
        } else {
          toast.error(result.error ?? "Failed to resolve incident");
        }
      });
    },
    [workspaceSlug],
  );

  const handleOpenUpdate = useCallback((incident: StatusOverrideItem) => {
    setEditingIncident(incident);
    setEditStatus(incident.status);
    setEditMessage(incident.message ?? "");
  }, []);

  const handleUpdate = useCallback(() => {
    if (!editingIncident || !editStatus) return;
    startTransition(async () => {
      const result = await setStatusOverride(workspaceSlug, {
        targetType: editingIncident.targetType,
        targetId: editingIncident.targetId,
        status: editStatus as "investigating" | "identified" | "monitoring",
        message: editMessage || undefined,
      });
      if (result.success) {
        toast.success("Incident updated");
        setEditingIncident(null);
      } else {
        toast.error(result.error ?? "Failed to update incident");
      }
    });
  }, [editingIncident, editStatus, editMessage, workspaceSlug]);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Incidents
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Declare and manage incidents visible on your public status page.
            </p>
          </div>
          {activeIncidents.length > 0 && (
            <Badge variant="destructive">
              {activeIncidents.length} Active
            </Badge>
          )}
        </div>
      </Card>

      {/* Active Incidents */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Active Incidents
          </h3>
        </div>
        <CardContent className="p-6">
          {activeIncidents.length > 0 ? (
            <div className="space-y-3">
              {activeIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="rounded-lg border p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">
                        {incident.targetName}
                      </span>
                      <Badge
                        variant={
                          incident.status === "monitoring"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {incident.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenUpdate(incident)}
                        disabled={isPending}
                      >
                        Update
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolve(incident.id)}
                        disabled={isPending}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                  {incident.message && (
                    <p className="text-sm text-muted-foreground">
                      {incident.message}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="size-2.5" />
                    Started {timeAgoShort(incident.createdAt)}
                    {incident.setByName && (
                      <span> &middot; Declared by {incident.setByName}</span>
                    )}
                    <span>
                      {" "}
                      &middot; Expires{" "}
                      {new Date(incident.expiresAt).toLocaleString()}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-500" />
              No active incidents — all systems operational
            </div>
          )}
        </CardContent>
      </Card>

      {/* Declare Incident */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Declare Incident
          </h3>
        </div>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Affected service" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.map((p) => (
                  <SelectGroup key={p.id}>
                    <SelectLabel>{p.name}</SelectLabel>
                    <SelectItem value={`product:${p.id}`}>
                      {p.name} (Product)
                    </SelectItem>
                    {p.features.map((f) => (
                      <SelectItem key={f.id} value={`feature:${f.id}`}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="identified">Identified</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Public message (optional, max 500 chars)"
            maxLength={500}
          />

          <Button
            onClick={handleDeclare}
            disabled={!target || !status || isPending}
            size="sm"
          >
            <AlertTriangle className="size-3.5 mr-1.5" />
            {isPending ? "Declaring..." : "Declare Incident"}
          </Button>
        </CardContent>
      </Card>

      {/* Incident History */}
      {resolvedIncidents.length > 0 && (
        <Card>
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className="w-full p-4 flex items-center justify-between hover:bg-muted/40 transition-colors"
          >
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              {showHistory ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              Incident History
            </h3>
            <span className="text-xs text-muted-foreground">
              {resolvedIncidents.length} resolved
            </span>
          </button>
          {showHistory && (
            <div className="divide-y">
              {resolvedIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="p-4 flex items-center justify-between gap-3 opacity-60"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium truncate">
                        {incident.targetName}
                      </span>
                      <Badge variant="outline">
                        {incident.isExpired ? "expired" : incident.status}
                      </Badge>
                    </div>
                    {incident.message && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {incident.message}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(incident.createdAt).toLocaleString()}
                      {incident.setByName && ` by ${incident.setByName}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Update Incident Dialog */}
      <Dialog
        open={!!editingIncident}
        onOpenChange={(open) => {
          if (!open) setEditingIncident(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Incident</DialogTitle>
            <DialogDescription>
              {editingIncident?.targetName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="identified">Identified</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Public Message
              </label>
              <Input
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                placeholder="Public message (optional, max 500 chars)"
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingIncident(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!editStatus || isPending}
            >
              {isPending ? "Updating..." : "Update Incident"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
