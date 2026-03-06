import Markdoc, { type Schema, Tag } from "@markdoc/markdoc";

/**
 * Custom fence (code block) node.
 * When the language is "mermaid", renders a <MermaidBlock> component (React)
 * or a placeholder <pre data-mermaid> (HTML) that the client can hydrate.
 */
export const fence: Schema = {
  ...Markdoc.nodes.fence,
  transform(node, config) {
    const language = (node.attributes["language"] as string) ?? "";

    if (language === "mermaid") {
      const content = (node.attributes["content"] as string) ?? "";
      return new Tag("MermaidBlock", { content }, []);
    }

    // All other languages: render with syntax highlighting
    const content = (node.attributes["content"] as string) ?? "";
    return new Tag("CodeBlock", { language: language || undefined, content }, []);
  },
};
