import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { WorkspaceRole } from "@/generated/prisma/client";

export type WorkspaceContext = {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
};

const roleHierarchy: Record<WorkspaceRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  OWNER: 2,
};

/**
 * Resolves the current workspace from the URL slug and verifies
 * that the authenticated user has access. Redirects to /workspaces
 * if unauthorized. Used in Server Components and Server Actions.
 */
export async function requireWorkspaceAccess(
  workspaceSlug: string,
  minimumRole?: WorkspaceRole,
): Promise<WorkspaceContext> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
      workspace: { slug: workspaceSlug },
    },
    include: { workspace: { select: { id: true } } },
  });

  if (!member) redirect("/workspaces");

  if (minimumRole) {
    if (roleHierarchy[member.role] < roleHierarchy[minimumRole]) {
      redirect("/workspaces");
    }
  }

  return {
    workspaceId: member.workspace.id,
    userId: session.user.id,
    role: member.role,
  };
}

/**
 * Lightweight version for Route Handlers — returns null instead of
 * redirecting, so the handler can return a proper HTTP error.
 */
export async function verifyWorkspaceAccess(
  workspaceSlug: string,
  minimumRole?: WorkspaceRole,
): Promise<WorkspaceContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const member = await prisma.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
      workspace: { slug: workspaceSlug },
    },
    include: { workspace: { select: { id: true } } },
  });

  if (!member) return null;

  if (minimumRole) {
    if (roleHierarchy[member.role] < roleHierarchy[minimumRole]) {
      return null;
    }
  }

  return {
    workspaceId: member.workspace.id,
    userId: session.user.id,
    role: member.role,
  };
}
