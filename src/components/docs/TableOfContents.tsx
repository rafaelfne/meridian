import styles from "./TableOfContents.module.css";
import clsx from "clsx";

export function TableOfContents({
    headings,
}: {
    headings: Array<{ id: string; title: string; level: number }>;
}) {
    if (headings.length === 0) return null;

    return (
        <nav className={styles.toc} aria-label="Table of contents">
            <p className={styles.title}>On this page</p>
            <ul className={styles.list}>
                {headings.map((heading) => (
                    <li key={heading.id} className={styles.item}>
                        <a
                            href={`#${heading.id}`}
                            className={clsx(styles.link, {
                                [styles.level3 ?? ""]: heading.level === 3,
                                [styles.level4 ?? ""]: heading.level >= 4,
                            })}
                        >
                            {heading.title}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
