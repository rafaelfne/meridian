"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronsUpDown, Plus, LayoutGrid } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import styles from "./WorkspaceSwitcher.module.css";

type WorkspaceItem = {
  id: string;
  name: string;
  slug: string;
};

interface WorkspaceSwitcherProps {
  currentSlug: string;
  currentName: string;
}

export function WorkspaceSwitcher({
  currentSlug,
  currentName,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    if (workspaces) return;
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces");
      const data = await res.json();
      setWorkspaces(
        data.map((w: { id: string; name: string; slug: string }) => ({
          id: w.id,
          name: w.name,
          slug: w.slug,
        })),
      );
    } finally {
      setLoading(false);
    }
  }, [workspaces]);

  const switchTo = useCallback(
    (slug: string) => {
      const newPath = pathname.replace(/^\/w\/[^/]+/, `/w/${slug}`);
      router.push(newPath);
    },
    [pathname, router],
  );

  return (
    <DropdownMenu onOpenChange={(open) => open && fetchWorkspaces()}>
      <DropdownMenuTrigger asChild>
        <button type="button" className={styles.trigger}>
          <span className={styles.workspaceName}>{currentName}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading && (
          <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
        )}
        {workspaces?.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onSelect={() => switchTo(ws.slug)}
            className={ws.slug === currentSlug ? "font-semibold" : ""}
          >
            {ws.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/workspaces")}>
          <LayoutGrid className="mr-2 size-4" />
          All workspaces
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => router.push("/workspaces?create=true")}
        >
          <Plus className="mr-2 size-4" />
          Create workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
