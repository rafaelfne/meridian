"use client";

import { useState, useTransition, useCallback } from "react";
import { testDatadogConnection } from "@/modules/workspace/actions/test-datadog-connection";
import { saveDatadogIntegration } from "@/modules/workspace/actions/save-datadog-integration";
import { revokeDatadogIntegration } from "@/modules/workspace/actions/revoke-datadog-integration";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Database,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

const SITES = [
  { value: "datadoghq.com", label: "datadoghq.com (US1)" },
  { value: "datadoghq.eu", label: "datadoghq.eu (EU)" },
  { value: "us3.datadoghq.com", label: "us3.datadoghq.com (US3)" },
  { value: "us5.datadoghq.com", label: "us5.datadoghq.com (US5)" },
] as const;

interface DatadogIntegrationSectionProps {
  workspaceSlug: string;
  existing: {
    site: string;
    status: "connected" | "invalid" | "revoked";
    connectedAt: string;
    apiKeyLast4: string;
    appKeyLast4: string;
  } | null;
}

export function DatadogIntegrationSection({
  workspaceSlug,
  existing,
}: DatadogIntegrationSectionProps) {
  const [apiKey, setApiKey] = useState("");
  const [appKey, setAppKey] = useState("");
  const [site, setSite] = useState(existing?.site ?? "datadoghq.com");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [testResult, setTestResult] = useState<"success" | "failed" | null>(
    null,
  );

  const [isTesting, startTestTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();
  const [isRevoking, startRevokeTransition] = useTransition();

  const isConnected = existing && existing.status === "connected";

  const handleTest = useCallback(() => {
    setTestResult(null);
    setErrors({});
    const fd = new FormData();
    fd.set("apiKey", apiKey);
    fd.set("appKey", appKey);
    fd.set("site", site);

    startTestTransition(async () => {
      const result = await testDatadogConnection(workspaceSlug, fd);
      if (result.success) {
        setTestResult("success");
        toast.success("Connection successful");
      } else {
        setTestResult("failed");
        setErrors(result.error ?? {});
        toast.error("Connection failed");
      }
    });
  }, [apiKey, appKey, site, workspaceSlug]);

  const handleSave = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({});
      const fd = new FormData();
      fd.set("apiKey", apiKey);
      fd.set("appKey", appKey);
      fd.set("site", site);

      startSaveTransition(async () => {
        const result = await saveDatadogIntegration(workspaceSlug, fd);
        if (result.success) {
          toast.success(
            result.status === "connected"
              ? "Datadog integration saved and connected"
              : "Integration saved but credentials appear invalid",
          );
          setApiKey("");
          setAppKey("");
          setTestResult(null);
        } else {
          setErrors(result.error ?? {});
        }
      });
    },
    [apiKey, appKey, site, workspaceSlug],
  );

  const handleRevoke = useCallback(() => {
    startRevokeTransition(async () => {
      const result = await revokeDatadogIntegration(workspaceSlug);
      if (result.success) {
        toast.success("Datadog integration revoked");
        setApiKey("");
        setAppKey("");
        setTestResult(null);
      }
    });
  }, [workspaceSlug]);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Main integration card */}
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Database className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Datadog</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Connect your Datadog account to fetch monitor data
                automatically.
              </p>
            </div>
          </div>

          {isConnected && (
            <div className="flex items-center gap-2 self-start sm:self-center px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-[11px] font-bold tracking-wide uppercase">
              <CheckCircle2 className="size-3.5" />
              Connected
            </div>
          )}
        </div>

        <div className="p-6 space-y-8">
          {/* Active configuration panel */}
          {existing && existing.status !== "revoked" && (
            <div className="border rounded-xl overflow-hidden bg-muted/30">
              <div className="px-5 py-3 bg-muted/50 border-b">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  Active Configuration
                </span>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-12">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase font-bold">
                    API Key
                  </label>
                  <div className="text-sm font-mono">
                    {existing.apiKeyLast4}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase font-bold">
                    App Key
                  </label>
                  <div className="text-sm font-mono">
                    {existing.appKeyLast4}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase font-bold">
                    Site (Region)
                  </label>
                  <div className="text-sm">{existing.site}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase font-bold">
                    Connected
                  </label>
                  <div className="text-sm">
                    {new Date(existing.connectedAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 border-t">
                <button
                  type="button"
                  onClick={handleRevoke}
                  disabled={isRevoking}
                  className="flex items-center gap-2 text-xs font-semibold text-destructive/80 hover:text-destructive transition-colors bg-destructive/5 hover:bg-destructive/10 px-3 py-1.5 rounded-lg border border-destructive/10 disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                  {isRevoking ? "Revoking..." : "Revoke Integration"}
                </button>
              </div>
            </div>
          )}

          {/* Credential form */}
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium block">API Key</label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter Datadog API key"
                />
                {errors.apiKey && (
                  <p className="text-destructive text-sm">
                    {errors.apiKey[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block">
                  Application Key
                </label>
                <Input
                  type="password"
                  value={appKey}
                  onChange={(e) => setAppKey(e.target.value)}
                  placeholder="Enter Datadog Application key"
                />
                {errors.appKey && (
                  <p className="text-destructive text-sm">
                    {errors.appKey[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block">Site</label>
                <Select value={site} onValueChange={setSite}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SITES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.site && (
                  <p className="text-destructive text-sm">{errors.site[0]}</p>
                )}
              </div>
            </div>

            {testResult === "success" && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" /> Credentials valid
              </div>
            )}
            {testResult === "failed" && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="size-4" /> Validation failed
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={isTesting || !apiKey || !appKey}
                className="w-full sm:w-auto"
              >
                <RefreshCw
                  className={`mr-2 size-4 ${isTesting ? "animate-spin" : ""}`}
                />
                {isTesting ? "Testing..." : "Test Connection"}
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !apiKey || !appKey}
                className="w-full sm:flex-1"
              >
                {isSaving
                  ? "Saving..."
                  : existing && existing.status !== "revoked"
                    ? "Update"
                    : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Security footer */}
      <div className="px-4 flex items-start gap-4 text-muted-foreground">
        <ShieldCheck className="size-5 text-primary/50 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-[11px] font-bold uppercase tracking-tight">
            Data Security
          </h4>
          <p className="text-xs leading-relaxed">
            Your credentials are encrypted (AES-256) and never displayed in
            full. See our{" "}
            <a
              href="/docs"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              security documentation{" "}
              <ExternalLink className="size-2.5" />
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
