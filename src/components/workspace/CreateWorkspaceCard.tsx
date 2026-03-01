"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";
import styles from "./CreateWorkspaceCard.module.css";

interface CreateWorkspaceCardProps {
  defaultOpen?: boolean;
}

export function CreateWorkspaceCard({
  defaultOpen = false,
}: CreateWorkspaceCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={styles.createCard}
      >
        <Plus className="size-6 text-muted-foreground" />
        <span>Create workspace</span>
      </button>
      <CreateWorkspaceDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
