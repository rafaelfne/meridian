"use client";

import { useEffect, useRef, useId, useState } from "react";
import styles from "./MermaidBlock.module.css";

interface MermaidBlockProps {
    content: string;
}

export function MermaidBlock({ content }: MermaidBlockProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const uniqueId = useId().replace(/:/g, "-");
    const [error, setError] = useState<string | null>(null);
    const [rendered, setRendered] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function render() {
            try {
                // Dynamic import to avoid SSR issues — mermaid only runs in the browser
                const mermaid = (await import("mermaid")).default;

                mermaid.initialize({
                    startOnLoad: false,
                    theme: "dark",
                    fontFamily: "var(--font-mono)",
                    securityLevel: "strict",
                });

                const { svg } = await mermaid.render(
                    `mermaid-${uniqueId}`,
                    content.trim(),
                );

                if (!cancelled && containerRef.current) {
                    containerRef.current.innerHTML = svg;
                    setRendered(true);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error ? err.message : "Failed to render diagram",
                    );
                    setRendered(true);
                }
            }
        }

        void render();

        return () => {
            cancelled = true;
        };
    }, [content, uniqueId]);

    if (error) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.errorHeader}>Mermaid diagram error</div>
                <pre className={styles.errorBody}>{error}</pre>
                <pre className={styles.source}>{content}</pre>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div
                ref={containerRef}
                className={styles.diagram}
                style={{ opacity: rendered ? 1 : 0 }}
            />
            {!rendered && <div className={styles.loading}>Rendering diagram…</div>}
        </div>
    );
}
