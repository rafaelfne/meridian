import React from "react";
import Markdoc, {
    type RenderableTreeNode,
    type RenderableTreeNodes,
} from "@markdoc/markdoc";
import { Callout } from "./markdoc/Callout";
import { ApiEndpoint } from "./markdoc/ApiEndpoint";
import { SystemRef } from "./markdoc/SystemRef";
import { MermaidBlock } from "./markdoc/MermaidBlock";
import styles from "./MarkdocRenderer.module.css";

const components = {
    Callout,
    ApiEndpoint,
    SystemRef,
    MermaidBlock,
};

export function MarkdocRenderer({
    content,
    workspaceSlug,
}: {
    content: RenderableTreeNode | RenderableTreeNodes;
    workspaceSlug: string;
}) {
    // Inject workspaceSlug into SystemRef via a wrapper
    const wrappedComponents = {
        ...components,
        SystemRef: (props: Record<string, unknown>) => (
            <SystemRef
                {...(props as { slug: string; label?: string })}
                workspaceSlug={workspaceSlug}
            />
        ),
    };

    return (
        <article className={styles.content}>
            {Markdoc.renderers.react(content, React, {
                components: wrappedComponents,
            })}
        </article>
    );
}
