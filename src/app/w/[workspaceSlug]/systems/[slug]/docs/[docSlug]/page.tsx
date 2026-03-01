export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { renderMarkdocSource } from "@/modules/docs/services/render-markdoc";
import { MarkdocRenderer } from "@/components/docs/MarkdocRenderer";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { AlertTriangle, ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";

export default async function DocumentPage({
    params,
}: {
    params: Promise<{ workspaceSlug: string; slug: string; docSlug: string }>;
}) {
    const { workspaceSlug, slug: systemSlug, docSlug } = await params;
    const ctx = await requireWorkspaceAccess(workspaceSlug);

    const doc = await prisma.document.findFirst({
        where: {
            slug: docSlug,
            system: {
                slug: systemSlug,
                domain: { workspaceId: ctx.workspaceId },
            },
        },
        include: {
            author: { select: { name: true, image: true } },
            system: { select: { name: true } },
        },
    });
    if (!doc) notFound();

    const { content, headings, errors } = renderMarkdocSource(doc.content);

    const canEdit = ctx.role === "EDITOR" || ctx.role === "OWNER";

    return (
        <div className="container mx-auto max-w-7xl py-8 px-4">
            {/* Breadcrumb */}
            <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Link
                    href={`/w/${workspaceSlug}/systems/${systemSlug}`}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={14} />
                    {doc.system.name}
                </Link>
                <span>/</span>
                <span className="text-foreground">{doc.title}</span>
            </div>

            <div className="flex gap-12">
                {/* Main content */}
                <div className="flex-1 min-w-0">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold tracking-tight">
                                {doc.title}
                            </h1>
                            {canEdit && (
                                <Link
                                    href={`/w/${workspaceSlug}/systems/${systemSlug}/docs/${docSlug}/edit`}
                                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Pencil size={14} />
                                    Edit
                                </Link>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            By {doc.author.name ?? "Unknown"} · Updated{" "}
                            {doc.updatedAt.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    </div>

                    {/* Validation warnings */}
                    {errors.length > 0 && (
                        <div className="mb-6 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-yellow-500 mb-2">
                                <AlertTriangle size={16} />
                                Markdoc validation warnings
                            </div>
                            <ul className="text-sm text-yellow-400/80 space-y-1">
                                {errors.map((err, i) => (
                                    <li key={i}>
                                        Line {err.lines.join("-")}: {err.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <MarkdocRenderer content={content} workspaceSlug={workspaceSlug} />
                </div>

                {/* Sidebar — Table of Contents */}
                {headings.length > 0 && (
                    <aside className="hidden lg:block w-56 flex-shrink-0">
                        <TableOfContents headings={headings} />
                    </aside>
                )}
            </div>
        </div>
    );
}
