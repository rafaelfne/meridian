"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettingsSection } from "./GeneralSettingsSection";
import { MembersSection } from "./MembersSection";
import { DatadogIntegrationSection } from "./DatadogIntegrationSection";
import { ApiKeysSection } from "./ApiKeysSection";
import { StatusPageSection } from "./StatusPageSection";
import { IncidentsSection } from "./IncidentsSection";
import type { StatusPageConfigData, StatusOverrideItem } from "@/modules/status-page/types";
import type { ApiKeyItem } from "@/modules/api-keys/types";

interface SettingsPageClientProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }>;
  currentUserId: string;
  userRole: string;
  workspaceSlug: string;
  datadogIntegration: {
    site: string;
    status: "connected" | "invalid" | "revoked";
    connectedAt: string;
    apiKeyLast4: string;
    appKeyLast4: string;
  } | null;
  statusPageConfig: StatusPageConfigData | null;
  availableProducts: Array<{
    id: string;
    name: string;
    features: Array<{ id: string; name: string }>;
  }>;
  overrides: StatusOverrideItem[];
  apiKeys: ApiKeyItem[];
}

export function SettingsPageClient({
  workspace,
  members,
  currentUserId,
  userRole,
  workspaceSlug,
  datadogIntegration,
  statusPageConfig,
  availableProducts,
  overrides,
  apiKeys,
}: SettingsPageClientProps) {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-8 px-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your workspace</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          {userRole === "OWNER" && (
            <TabsTrigger value="members">Members</TabsTrigger>
          )}
          {userRole === "OWNER" && (
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          )}
          {userRole === "OWNER" && (
            <TabsTrigger value="status-page">Status Page</TabsTrigger>
          )}
          {userRole === "OWNER" && (
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralSettingsSection
            workspace={workspace}
            workspaceSlug={workspaceSlug}
          />
        </TabsContent>

        {userRole === "OWNER" && (
          <TabsContent value="members" className="mt-6">
            <MembersSection
              members={members}
              workspaceSlug={workspaceSlug}
              currentUserId={currentUserId}
            />
          </TabsContent>
        )}

        {userRole === "OWNER" && (
          <TabsContent value="integrations" className="mt-6">
            <div className="space-y-8">
              <DatadogIntegrationSection
                workspaceSlug={workspaceSlug}
                existing={datadogIntegration}
              />
              <ApiKeysSection
                workspaceSlug={workspaceSlug}
                apiKeys={apiKeys}
              />
            </div>
          </TabsContent>
        )}

        {userRole === "OWNER" && (
          <TabsContent value="status-page" className="mt-6">
            <StatusPageSection
              workspaceSlug={workspaceSlug}
              workspaceName={workspace.name}
              config={statusPageConfig}
              availableProducts={availableProducts}
            />
          </TabsContent>
        )}

        {userRole === "OWNER" && (
          <TabsContent value="incidents" className="mt-6">
            <IncidentsSection
              workspaceSlug={workspaceSlug}
              availableProducts={availableProducts}
              overrides={overrides}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
