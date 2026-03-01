import Markdoc, { type Schema, type RenderableTreeNode, Tag } from "@markdoc/markdoc";

function generateId(
  children: RenderableTreeNode[],
  attributes: Record<string, unknown>,
): string {
  if (attributes["id"] && typeof attributes["id"] === "string")
    return attributes["id"];
  return children
    .filter((child): child is string => typeof child === "string")
    .join(" ")
    .replace(/[?]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export const heading: Schema = {
  ...Markdoc.nodes.heading,
  transform(node, config) {
    const base = Markdoc.nodes.heading.transform!(node, config);
    if (base && typeof base === "object" && "attributes" in base) {
      const tag = base as Tag;
      tag.attributes["id"] = generateId(
        tag.children,
        tag.attributes as Record<string, unknown>,
      );
    }
    return base;
  },
};
