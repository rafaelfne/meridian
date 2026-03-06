"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./DocsNavbar.module.css";

export function DocsNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={styles.nav} data-scrolled={scrolled}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoMark}>
            <span>M</span>
          </div>
          <span className={styles.logoText}>MERIDIAN</span>
          <span className={styles.breadcrumb}>/ Docs</span>
        </Link>

        <div className={styles.links}>
          <Link href="/" className={styles.link}>
            Home
          </Link>
          <Link href="/workspaces" className={styles.cta}>
            Open App
          </Link>
        </div>
      </div>
    </nav>
  );
}
