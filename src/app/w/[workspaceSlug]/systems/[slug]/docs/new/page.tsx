export const dynamic = "force-dynamic";

import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { DocumentEditor } from "@/components/docs/DocumentEditor";

export default async function NewDocumentPage({
    params,
}: {
    params: Promise<{ workspaceSlug: string; slug: string }>;
}) {
    const { workspaceSlug, slug: systemSlug } = await params;
    await requireWorkspaceAccess(workspaceSlug, "EDITOR");

    return (
        <DocumentEditor
            document={null}
            workspaceSlug={workspaceSlug}
            systemSlug={systemSlug}
        />
    );
}
