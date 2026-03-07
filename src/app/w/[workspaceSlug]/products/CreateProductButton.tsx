"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateProductDialog } from "@/components/products/CreateProductDialog";

interface CreateProductButtonProps {
  workspaceSlug: string;
  systems: { id: string; name: string }[];
}

export function CreateProductButton({
  workspaceSlug,
  systems,
}: CreateProductButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-1 size-4" />
        New Product
      </Button>
      <CreateProductDialog
        open={open}
        onOpenChange={setOpen}
        workspaceSlug={workspaceSlug}
        systems={systems}
      />
    </>
  );
}
