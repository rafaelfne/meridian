export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { SettingsPageClient } from "@/components/workspace/SettingsPageClient";
import { ENUM_TO_SITE } from "@/modules/workspace/validators/datadog-integration-schema";

function maskKey(encrypted: string, isRevoked: boolean): string {
  if (isRevoked || !encrypted) {
    return "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
  }
  try {
    const plaintext = decrypt(encrypted);
    return "\u2022\u2022\u2022\u2022" + plaintext.slice(-4);
  } catch {
    return "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
  }
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const ctx = await requireWorkspaceAccess(workspaceSlug, "EDITOR");

  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: ctx.workspaceId },
    select: { id: true, name: true, slug: true, description: true },
  });

  const members =
    ctx.role === "OWNER"
      ? await prisma.workspaceMember.findMany({
          where: { workspaceId: ctx.workspaceId },
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { createdAt: "asc" },
        })
      : [];

  const datadogRow =
    ctx.role === "OWNER"
      ? await prisma.datadogIntegration.findUnique({
          where: { workspaceId: ctx.workspaceId },
          select: {
            site: true,
            status: true,
            connectedAt: true,
            apiKey: true,
            appKey: true,
          },
        })
      : null;

  const isRevoked = datadogRow?.status === "REVOKED";
  const datadogIntegration = datadogRow
    ? {
        site: ENUM_TO_SITE[datadogRow.site] ?? "datadoghq.com",
        status: datadogRow.status.toLowerCase() as
          | "connected"
          | "invalid"
          | "revoked",
        connectedAt: datadogRow.connectedAt.toISOString(),
        apiKeyLast4: maskKey(datadogRow.apiKey, isRevoked),
        appKeyLast4: maskKey(datadogRow.appKey, isRevoked),
      }
    : null;

  return (
    <SettingsPageClient
      workspace={workspace}
      members={members.map((m) => ({
        id: m.id,
        role: m.role,
        user: m.user,
      }))}
      currentUserId={ctx.userId}
      userRole={ctx.role}
      workspaceSlug={workspaceSlug}
      datadogIntegration={datadogIntegration}
    />
  );
}
