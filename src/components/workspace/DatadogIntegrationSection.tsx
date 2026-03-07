"use client";

import { useState, useTransition, useCallback } from "react";
import { testDatadogConnection } from "@/modules/workspace/actions/test-datadog-connection";
import { saveDatadogIntegration } from "@/modules/workspace/actions/save-datadog-integration";
import { revokeDatadogIntegration } from "@/modules/workspace/actions/revoke-datadog-integration";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Ban, Loader2 } from "lucide-react";

const SITES = [
  { value: "datadoghq.com", label: "datadoghq.com (US1)" },
  { value: "datadoghq.eu", label: "datadoghq.eu (EU)" },
  { value: "us3.datadoghq.com", label: "us3.datadoghq.com (US3)" },
  { value: "us5.datadoghq.com", label: "us5.datadoghq.com (US5)" },
] as const;

function StatusBadge({
  status,
}: {
  status: "connected" | "invalid" | "revoked";
}) {
  switch (status) {
    case "connected":
      return (
        <Badge className="border-green-200 bg-green-100 text-green-800">
          <CheckCircle2 className="mr-1 size-3" /> Connected
        </Badge>
      );
    case "invalid":
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 size-3" /> Invalid
        </Badge>
      );
    case "revoked":
      return (
        <Badge variant="secondary">
          <Ban className="mr-1 size-3" /> Revoked
        </Badge>
      );
  }
}

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Datadog</CardTitle>
            <CardDescription>
              Connect your Datadog account to fetch monitor data automatically.
            </CardDescription>
          </div>
          {existing && <StatusBadge status={existing.status} />}
        </div>
      </CardHeader>
      <CardContent>
        {existing && existing.status !== "revoked" && (
          <div className="mb-6 space-y-2 rounded-md border p-4">
            <div className="text-sm">
              <span className="font-medium">API Key:</span>{" "}
              <code className="text-muted-foreground">
                {existing.apiKeyLast4}
              </code>
            </div>
            <div className="text-sm">
              <span className="font-medium">App Key:</span>{" "}
              <code className="text-muted-foreground">
                {existing.appKeyLast4}
              </code>
            </div>
            <div className="text-sm">
              <span className="font-medium">Site:</span> {existing.site}
            </div>
            <div className="text-muted-foreground text-sm">
              Connected{" "}
              {new Date(existing.connectedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevoke}
              disabled={isRevoking}
              className="mt-2"
            >
              {isRevoking ? "Revoking..." : "Revoke Integration"}
            </Button>
          </div>
        )}

        <form onSubmit={handleSave} className="max-w-md space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="dd-api-key"
              className="text-foreground text-sm font-medium"
            >
              API Key
            </label>
            <Input
              id="dd-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter Datadog API key"
            />
            {errors.apiKey && (
              <p className="text-destructive text-sm">{errors.apiKey[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="dd-app-key"
              className="text-foreground text-sm font-medium"
            >
              Application Key
            </label>
            <Input
              id="dd-app-key"
              type="password"
              value={appKey}
              onChange={(e) => setAppKey(e.target.value)}
              placeholder="Enter Datadog Application key"
            />
            {errors.appKey && (
              <p className="text-destructive text-sm">{errors.appKey[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="dd-site"
              className="text-foreground text-sm font-medium"
            >
              Site
            </label>
            <Select value={site} onValueChange={setSite}>
              <SelectTrigger id="dd-site" className="w-full">
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

          {testResult === "success" && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="size-4" /> Credentials valid
            </div>
          )}
          {testResult === "failed" && (
            <div className="text-destructive flex items-center gap-2 text-sm">
              <XCircle className="size-4" /> Validation failed
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={isTesting || !apiKey || !appKey}
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
            <Button type="submit" disabled={isSaving || !apiKey || !appKey}>
              {isSaving
                ? "Saving..."
                : existing && existing.status !== "revoked"
                  ? "Update"
                  : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
