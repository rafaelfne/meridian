"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditProductDialog } from "@/components/products/EditProductDialog";
import { deleteProductAction } from "@/modules/product/actions/delete-product";
import type { ProductDetail } from "@/modules/product/types";

interface ProductDetailActionsProps {
  workspaceSlug: string;
  product: ProductDetail;
  allSystems: { id: string; name: string }[];
  userRole: string;
}

export function ProductDetailActions({
  workspaceSlug,
  product,
  allSystems,
  userRole,
}: ProductDetailActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const canEdit = userRole === "OWNER" || userRole === "EDITOR";

  const handleDelete = useCallback(() => {
    startDeleteTransition(async () => {
      const result = await deleteProductAction(workspaceSlug, product.id);
      if (result.success) {
        toast.success("Product deleted");
        router.push(`/w/${workspaceSlug}/products`);
      } else {
        toast.error(result.error ?? "Failed to delete product");
      }
    });
  }, [workspaceSlug, product.id, router]);

  if (!canEdit) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-1 size-3.5" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-1 size-3.5" />
          Delete
        </Button>
      </div>

      <EditProductDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        workspaceSlug={workspaceSlug}
        product={product}
        systems={allSystems}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{product.name}&rdquo;? This
              will remove the product and unlink all associated systems. The
              systems themselves will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
