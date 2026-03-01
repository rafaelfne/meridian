"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Network, Server, Upload } from "lucide-react";
import clsx from "clsx";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import styles from "./AppHeader.module.css";

const NAV_SUFFIXES = [
  { suffix: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { suffix: "/graph", label: "Graph", icon: Network },
  { suffix: "/systems", label: "Systems", icon: Server },
  { suffix: "/upload", label: "Upload", icon: Upload },
] as const;

export function AppHeader({ workspaceSlug }: { workspaceSlug?: string }) {
  const pathname = usePathname();

  const prefix = workspaceSlug ? `/w/${workspaceSlug}` : "";
  const brandHref = workspaceSlug ? `/w/${workspaceSlug}/dashboard` : "/workspaces";

  return (
    <header className={styles.header}>
      <Link href={brandHref} className={styles.brand}>
        Domain Mapper
      </Link>
      <nav className={styles.nav}>
        {NAV_SUFFIXES.map((item) => {
          const href = `${prefix}${item.suffix}`;
          const isActive =
            item.suffix === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href);
          return (
            <Link
              key={item.suffix}
              href={href}
              className={clsx(styles.navLink, isActive && styles.navLinkActive)}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className={styles.actions}>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
