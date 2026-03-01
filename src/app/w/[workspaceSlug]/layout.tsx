import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { prisma } from "@/lib/prisma";
import { SessionProvider } from "@/components/shared/SessionProvider";
import { AppHeader } from "@/components/shared/AppHeader";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  const ctx = await requireWorkspaceAccess(workspaceSlug);

  const workspace = await prisma.workspace.findUnique({
    where: { id: ctx.workspaceId },
    select: { name: true },
  });

  return (
    <SessionProvider>
      <div className="flex h-screen flex-col">
        <AppHeader
          workspaceSlug={workspaceSlug}
          workspaceName={workspace?.name ?? workspaceSlug}
          userRole={ctx.role}
        />
        <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </SessionProvider>
  );
}
