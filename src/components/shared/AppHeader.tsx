"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Network, Server, Upload } from "lucide-react";
import clsx from "clsx";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import styles from "./AppHeader.module.css";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/graph", label: "Graph", icon: Network },
  { href: "/systems", label: "Systems", icon: Server },
  { href: "/upload", label: "Upload", icon: Upload },
] as const;

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <Link href="/dashboard" className={styles.brand}>
        Domain Mapper
      </Link>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
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
