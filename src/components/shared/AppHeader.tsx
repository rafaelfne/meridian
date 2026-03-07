"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Network,
  Server,
  Package,
  Upload,
  Settings,
  Menu,
} from "lucide-react";
import clsx from "clsx";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-media-query";
import styles from "./AppHeader.module.css";

const NAV_SUFFIXES = [
  { suffix: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { suffix: "/graph", label: "Graph", icon: Network },
  { suffix: "/systems", label: "Systems", icon: Server },
  { suffix: "/products", label: "Products", icon: Package },
  { suffix: "/upload", label: "Upload", icon: Upload },
] as const;

interface AppHeaderProps {
  workspaceSlug?: string;
  workspaceName?: string;
  userRole?: string;
}

export function AppHeader({
  workspaceSlug,
  workspaceName,
  userRole,
}: AppHeaderProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const prefix = workspaceSlug ? `/w/${workspaceSlug}` : "";
  const brandHref = workspaceSlug
    ? `/w/${workspaceSlug}/dashboard`
    : "/workspaces";

  const showSettings = userRole === "OWNER" || userRole === "EDITOR";

  const navLinks = workspaceSlug ? (
    <>
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
            className={clsx(
              isMobile ? styles.mobileNavLink : styles.navLink,
              isActive && (isMobile ? styles.mobileNavLinkActive : styles.navLinkActive),
            )}
            onClick={() => setMobileNavOpen(false)}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
      {showSettings && (
        <Link
          href={`/w/${workspaceSlug}/settings`}
          className={clsx(
            isMobile ? styles.mobileNavLink : styles.navLink,
            pathname.startsWith(`/w/${workspaceSlug}/settings`) &&
              (isMobile ? styles.mobileNavLinkActive : styles.navLinkActive),
          )}
          onClick={() => setMobileNavOpen(false)}
        >
          <Settings className="size-4" />
          Settings
        </Link>
      )}
    </>
  ) : null;

  return (
    <header className={styles.header}>
      {/* Hamburger — visible on mobile only */}
      {workspaceSlug && (
        <button
          type="button"
          className={styles.hamburger}
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>
      )}

      <Link href={brandHref} className={styles.brand}>
        Meridian
      </Link>

      {workspaceSlug && workspaceName && (
        <>
          <span className={styles.separator}>/</span>
          <WorkspaceSwitcher
            currentSlug={workspaceSlug}
            currentName={workspaceName}
          />
        </>
      )}

      {/* Desktop nav */}
      {workspaceSlug && (
        <nav className={styles.nav}>
          {navLinks}
        </nav>
      )}

      <div className={styles.actions}>
        <ThemeToggle />
        <UserMenu />
      </div>

      {/* Mobile nav sheet */}
      {workspaceSlug && (
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className={styles.mobileSheet}>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <nav className={styles.mobileNav}>
              {navLinks}
            </nav>
          </SheetContent>
        </Sheet>
      )}
    </header>
  );
}
