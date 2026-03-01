export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { DocumentEditor } from "@/components/docs/DocumentEditor";

export default async function EditDocumentPage({
    params,
}: {
    params: Promise<{ workspaceSlug: string; slug: string; docSlug: string }>;
}) {
    const { workspaceSlug, slug: systemSlug, docSlug } = await params;
    await requireWorkspaceAccess(workspaceSlug, "EDITOR");

    const doc = await prisma.document.findFirst({
        where: {
            slug: docSlug,
            system: {
                slug: systemSlug,
                domain: { workspace: { slug: workspaceSlug } },
            },
        },
        select: {
            id: true,
            title: true,
            slug: true,
            content: true,
        },
    });
    if (!doc) notFound();

    return (
        <DocumentEditor
            document={doc}
            workspaceSlug={workspaceSlug}
            systemSlug={systemSlug}
        />
    );
}
