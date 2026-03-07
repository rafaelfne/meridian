export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductTier } from "@/modules/product/types";
import { ProductDetailActions } from "./ProductDetailActions";

const TIER_VARIANT: Record<ProductTier, "destructive" | "default" | "secondary" | "outline"> = {
  CRITICAL: "destructive",
  HIGH: "default",
  MEDIUM: "secondary",
  LOW: "outline",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; slug: string }>;
}) {
  const { workspaceSlug, slug } = await params;
  const ctx = await requireWorkspaceAccess(workspaceSlug);

  const product = await prisma.product.findUnique({
    where: {
      workspaceId_slug: {
        workspaceId: ctx.workspaceId,
        slug,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      tier: true,
      createdAt: true,
      updatedAt: true,
      systems: {
        select: {
          system: {
            select: {
              id: true,
              name: true,
              slug: true,
              language: true,
              framework: true,
              domain: { select: { name: true } },
            },
          },
        },
        orderBy: { system: { name: "asc" } },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const systems = product.systems.map((ps) => ps.system);
  const tier = product.tier as ProductTier;

  // Fetch all workspace systems for the edit dialog
  const allSystems = await prisma.system.findMany({
    where: { domain: { workspaceId: ctx.workspaceId } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const productDetail = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    tier,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    systems,
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-8 py-8 px-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {product.name}
            </h1>
            <Badge variant={TIER_VARIANT[tier]}>{tier}</Badge>
          </div>
          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}
        </div>
        <ProductDetailActions
          workspaceSlug={workspaceSlug}
          product={productDetail}
          allSystems={allSystems}
          userRole={ctx.role}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Linked Systems ({systems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead className="hidden sm:table-cell">Language</TableHead>
                  <TableHead className="hidden sm:table-cell">Framework</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systems.map((system) => (
                  <TableRow key={system.id}>
                    <TableCell>
                      <Link
                        href={`/w/${workspaceSlug}/systems/${system.slug}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {system.name}
                      </Link>
                    </TableCell>
                    <TableCell>{system.domain.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {system.language ?? "--"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {system.framework ?? "--"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No systems linked to this product yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
