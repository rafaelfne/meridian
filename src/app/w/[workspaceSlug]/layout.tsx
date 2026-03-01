import { requireWorkspaceAccess } from "@/lib/workspace-context";
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

  await requireWorkspaceAccess(workspaceSlug);

  return (
    <SessionProvider>
      <div className="flex h-screen flex-col">
        <AppHeader workspaceSlug={workspaceSlug} />
        <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </SessionProvider>
  );
}
