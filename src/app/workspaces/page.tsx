import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function WorkspacesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      _count: { select: { members: true, domains: true } },
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-8 px-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
        <p className="text-muted-foreground">
          Select a workspace or create a new one
        </p>
      </div>

      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              You don&apos;t have any workspaces yet. Create one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {workspaces.map((ws) => {
            const userRole = ws.members[0]?.role;
            return (
              <Link key={ws.id} href={`/w/${ws.slug}/dashboard`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{ws.name}</CardTitle>
                      {userRole && (
                        <Badge variant="secondary">{userRole}</Badge>
                      )}
                    </div>
                    {ws.description && (
                      <CardDescription>{ws.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{ws._count.members} member(s)</span>
                      <span>{ws._count.domains} domain(s)</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
