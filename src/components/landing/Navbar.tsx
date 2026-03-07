"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { GitHubSignInButton } from "./GitHubSignInButton";
import styles from "./Navbar.module.css";

const NAV_LINKS = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#tech", label: "Stack" },
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
                <a href="#" className={styles.logo}>
                    <Image
                        src="/icon.png"
                        alt="Meridian"
                        width={32}
                        height={32}
                        className={styles.logoIcon}
                    />
                </a>

                <div className={styles.links}>
                    {NAV_LINKS.map((link) => (
                        <a key={link.href} href={link.href} className={styles.link}>
                            {link.label}
                        </a>
                    ))}
                    <GitHubSignInButton />
                </div>

                <button
                    type="button"
                    className={styles.hamburger}
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={menuOpen}
                >
                    <span className={styles.hamburgerLine} data-open={menuOpen} />
                    <span className={styles.hamburgerLine} data-open={menuOpen} />
                    <span className={styles.hamburgerLine} data-open={menuOpen} />
                </button>
            </div>

            {menuOpen && (
                <div className={styles.mobileMenu}>
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
                    <div className={styles.mobileSignIn}>
                        <GitHubSignInButton />
                    </div>
                </div>
            )}
        </nav>
    );
}
