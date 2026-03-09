export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import type { ProductListItem } from "@/modules/product/types";
import { ProductsTable } from "@/components/products/ProductsTable";
import { CreateProductButton } from "./CreateProductButton";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const ctx = await requireWorkspaceAccess(workspaceSlug);

  const [products, systems] = await Promise.all([
    prisma.product.findMany({
      where: { workspaceId: ctx.workspaceId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        tier: true,
        _count: { select: { systems: true } },
      },
    }) as Promise<ProductListItem[]>,
    prisma.system.findMany({
      where: { domain: { workspaceId: ctx.workspaceId } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <ProductsTable
        products={products}
        workspaceSlug={workspaceSlug}
        createButton={
          <CreateProductButton
            workspaceSlug={workspaceSlug}
            systems={systems}
          />
        }
      />
    </div>
  );
}
