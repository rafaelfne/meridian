"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import styles from "./DocsTableOfContents.module.css";

interface TocItem {
  readonly id: string;
  readonly title: string;
  readonly level: 2 | 3;
}

export function DocsTableOfContents({ items }: { items: readonly TocItem[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -50% 0px", threshold: 0 }
    );

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className={styles.toc} aria-label="Table of contents">
      <p className={styles.title}>On this page</p>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <a
              href={`#${item.id}`}
              className={clsx(
                styles.link,
                item.level === 3 && styles.nested,
                activeId === item.id && styles.active
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
