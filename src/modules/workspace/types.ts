import type { WorkspaceRole } from "@/generated/prisma/client";

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    members: number;
    domains: number;
  };
  members: { role: WorkspaceRole }[];
};
