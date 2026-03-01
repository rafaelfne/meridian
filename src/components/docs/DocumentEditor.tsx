"use client";

import { useState, useCallback, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createDocument } from "@/modules/docs/actions/create-document";
import { updateDocument } from "@/modules/docs/actions/update-document";
import styles from "./DocumentEditor.module.css";

type Props = {
    document: { id: string; title: string; slug: string; content: string } | null;
    workspaceSlug: string;
    systemSlug: string;
};

function toSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // strip diacritics
        .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric
        .replace(/^-+|-+$/g, "") // trim leading/trailing -
        .slice(0, 80);
}

export function DocumentEditor({ document, workspaceSlug, systemSlug }: Props) {
    const isNew = document === null;
    const router = useRouter();
    const [title, setTitle] = useState(document?.title ?? "");
    const [slug, setSlug] = useState(document?.slug ?? "");
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(!isNew);
    const [content, setContent] = useState(document?.content ?? DEFAULT_TEMPLATE);
    const [previewHtml, setPreviewHtml] = useState<string>("");
    const [previewErrors, setPreviewErrors] = useState<
        Array<{ message: string; lines: number[] }>
    >([]);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [slugTaken, setSlugTaken] = useState(false);
    const [checkingSlug, setCheckingSlug] = useState(false);
    const [isPending, startTransition] = useTransition();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const slugCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-generate slug from title (only when creating a new doc and slug not manually edited)
    useEffect(() => {
        if (isNew && !slugManuallyEdited) {
            setSlug(toSlug(title));
        }
    }, [title, isNew, slugManuallyEdited]);

    // Debounced slug uniqueness check
    useEffect(() => {
        if (!isNew && slug === document?.slug) {
            setSlugTaken(false);
            return;
        }
        if (!slug || slug.length === 0) {
            setSlugTaken(false);
            return;
        }
        if (slugCheckRef.current) clearTimeout(slugCheckRef.current);
        setCheckingSlug(true);
        slugCheckRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/w/${workspaceSlug}/systems/${systemSlug}/docs/check-slug?slug=${encodeURIComponent(slug)}`,
                );
                if (res.ok) {
                    const data = (await res.json()) as { available: boolean };
                    setSlugTaken(!data.available);
                }
            } catch {
                // silently fail
            } finally {
                setCheckingSlug(false);
            }
        }, 350);
        return () => {
            if (slugCheckRef.current) clearTimeout(slugCheckRef.current);
        };
    }, [slug, isNew, workspaceSlug, systemSlug, document?.slug]);

    // Debounced preview
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/w/${workspaceSlug}/docs/preview`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ source: content }),
                    },
                );
                if (res.ok) {
                    const data = (await res.json()) as {
                        html: string;
                        errors: Array<{ message: string; lines: number[] }>;
                    };
                    setPreviewHtml(data.html);
                    setPreviewErrors(data.errors ?? []);
                }
            } catch {
                // Silently fail on preview
            }
        }, 400);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [content, workspaceSlug]);

    const handleSave = useCallback(async () => {
        setFieldErrors({});
        startTransition(async () => {
            const formData = new FormData();
            formData.set("title", title);
            formData.set("content", content);

            if (isNew) {
                formData.set("slug", slug);
                const result = await createDocument(workspaceSlug, systemSlug, formData);
                if (!result.success) {
                    if (typeof result.error === "object" && result.error !== null) {
                        setFieldErrors(
                            result.error as Record<string, string[]>,
                        );
                    }
                    return;
                }
                router.push(
                    `/w/${workspaceSlug}/systems/${systemSlug}/docs/${result.data.slug}`,
                );
            } else {
                const result = await updateDocument(
                    workspaceSlug,
                    systemSlug,
                    document.slug,
                    formData,
                );
                if (!result.success) {
                    if (typeof result.error === "object" && result.error !== null) {
                        setFieldErrors(
                            result.error as Record<string, string[]>,
                        );
                    }
                    return;
                }
                router.push(
                    `/w/${workspaceSlug}/systems/${systemSlug}/docs/${document.slug}`,
                );
            }
        });
    }, [title, slug, content, isNew, workspaceSlug, systemSlug, document, router]);

    const canSave = !isPending && !slugTaken && !checkingSlug && title.trim().length > 0 && slug.length > 0;

    return (
        <div className={styles.editor}>
            <div className={styles.toolbar}>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Document title"
                    className={styles.titleInput}
                />
                {fieldErrors["title"] && (
                    <span className={styles.fieldError}>
                        {fieldErrors["title"].join(", ")}
                    </span>
                )}
                {isNew && (
                    <div className={styles.slugGroup}>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => {
                                setSlugManuallyEdited(true);
                                setSlug(e.target.value);
                            }}
                            placeholder="url-slug"
                            className={slugTaken ? `${styles.slugInput} ${styles.slugInputError}` : styles.slugInput}
                        />
                        {slugTaken && (
                            <span className={styles.slugError}>
                                Slug already in use
                            </span>
                        )}
                        {fieldErrors["slug"] && (
                            <span className={styles.fieldError}>
                                {fieldErrors["slug"].join(", ")}
                            </span>
                        )}
                    </div>
                )}
                <button
                    onClick={handleSave}
                    disabled={!canSave}
                    className={styles.saveButton}
                >
                    {isPending ? "Saving…" : isNew ? "Create" : "Save"}
                </button>
            </div>

            <div className={styles.sourcePane}>
                <div className={styles.paneHeader}>Source</div>
                <textarea
                    className={styles.textarea}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your documentation in Markdoc…"
                    spellCheck={false}
                />
            </div>

            <div className={styles.previewPane}>
                <div className={styles.paneHeader}>Preview</div>
                {previewErrors.length > 0 && (
                    <div className={styles.errors}>
                        {previewErrors.map((err, i) => (
                            <span key={i} className={styles.errorItem}>
                                Line {err.lines.join("-")}: {err.message}
                            </span>
                        ))}
                    </div>
                )}
                <div
                    className={styles.previewContent}
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
            </div>
        </div>
    );
}

const DEFAULT_TEMPLATE = `---
title: Document Title
---

# Overview

Describe the system here.

{% callout type="note" title="Getting Started" %}
Add relevant information for your team.
{% /callout %}

## API Endpoints

{% api-endpoint method="GET" path="/v1/example" description="Example endpoint" /%}

## Dependencies

This system depends on {% system-ref slug="other-system" label="Other System" /%}.
`;
