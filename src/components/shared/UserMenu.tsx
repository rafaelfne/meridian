"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import styles from "./UserMenu.module.css";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading" || !session?.user) return null;

  const { user } = session;
  const initials = getInitials(user.name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={styles.trigger} title={user.name ?? "Account"}>
          {user.image ? (
            <img
              src={user.image}
              alt=""
              className={styles.avatar}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className={styles.avatarFallback}>{initials}</span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2 font-normal">
          <User className="size-4 text-muted-foreground" />
          <div className="flex flex-col">
            {user.name && (
              <span className="text-sm font-medium">{user.name}</span>
            )}
            {user.username && (
              <span className="text-xs text-muted-foreground truncate">
                @{user.username}
              </span>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
