"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettingsSection } from "./GeneralSettingsSection";
import { MembersSection } from "./MembersSection";
import { DatadogIntegrationSection } from "./DatadogIntegrationSection";

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
}

export function SettingsPageClient({
  workspace,
  members,
  currentUserId,
  userRole,
  workspaceSlug,
  datadogIntegration,
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
            <DatadogIntegrationSection
              workspaceSlug={workspaceSlug}
              existing={datadogIntegration}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
