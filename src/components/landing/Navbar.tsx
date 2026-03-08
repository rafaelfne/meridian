"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import styles from "./Navbar.module.css";

const NAV_LINKS = [
  { href: "#philosophy", label: "Philosophy" },
  { href: "#features", label: "Capabilities" },
  { href: "/docs", label: "Docs" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <nav className={styles.nav} data-scrolled={scrolled || menuOpen}>
      <div className={styles.inner}>
        {/* Brand */}
        <a href="#" className={styles.brand}>
          <Image
            src="/icon.png"
            alt="Home"
            width={36}
            height={36}
            className={styles.brandIcon}
          />
        </a>

        {/* Desktop links */}
        <div className={styles.links}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={styles.link}>
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className={styles.actions}>
          <Link href="/login" className={styles.ctaLink}>
            Get Started
          </Link>
        </div>

        {/* Hamburger */}
        <button
          type="button"
          className={styles.hamburger}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileMenuInner}>
            <div className={styles.mobileMenuHeader}>
              <a href="#" className={styles.brand} onClick={closeMenu}>
                <Image
                  src="/icon.png"
                  alt="Home"
                  width={36}
                  height={36}
                  className={styles.brandIcon}
                />
              </a>
              <button
                type="button"
                className={styles.mobileClose}
                onClick={closeMenu}
              >
                <X size={24} />
              </button>
            </div>
            <div className={styles.mobileLinks}>
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={styles.mobileLink}
                  onClick={closeMenu}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className={styles.mobileCta}>
              <Link href="/login" className={styles.ctaLink} onClick={closeMenu}>
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
