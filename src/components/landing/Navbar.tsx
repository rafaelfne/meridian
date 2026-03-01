"use client";

import { useState, useEffect } from "react";
import { GitHubSignInButton } from "./GitHubSignInButton";
import styles from "./Navbar.module.css";

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <nav className={styles.nav} data-scrolled={scrolled}>
            <div className={styles.inner}>
                <a href="#" className={styles.logo}>
                    <div className={styles.logoMark}>
                        <span>M</span>
                    </div>
                    <span className={styles.logoText}>MERIDIAN</span>
                </a>

                <div className={styles.links}>
                    <a href="#features" className={styles.link}>
                        Features
                    </a>
                    <a href="#how-it-works" className={styles.link}>
                        How it works
                    </a>
                    <a href="#tech" className={styles.link}>
                        Stack
                    </a>
                    <GitHubSignInButton />
                </div>
            </div>
        </nav>
    );
}
