import Markdoc, { type RenderableTreeNode, type RenderableTreeNodes } from "@markdoc/markdoc";
import { markdocConfig } from "../markdoc/config";

export type RenderResult = {
  content: RenderableTreeNode | RenderableTreeNodes;
  frontmatter: Record<string, unknown>;
  headings: Array<{ id: string; title: string; level: number }>;
  errors: Array<{ message: string; lines: number[] }>;
};

export function renderMarkdocSource(source: string): RenderResult {
  const ast = Markdoc.parse(source);

  // Extract frontmatter
  const frontmatter = ast.attributes["frontmatter"]
    ? parseFrontmatter(ast.attributes["frontmatter"] as string)
    : {};

  // Validate
  const errors = Markdoc.validate(ast, markdocConfig).map((e) => ({
    message: e.error.message,
    lines: e.lines,
  }));

  // Transform to renderable tree
  const content = Markdoc.transform(ast, {
    ...markdocConfig,
    variables: { frontmatter },
  });

  // Extract headings for table of contents
  const headings: RenderResult["headings"] = [];
  for (const node of ast.walk()) {
    if (node.type === "heading") {
      const level = node.attributes["level"] as number;
      // Heading children are 'inline' nodes containing 'text'/'code' nodes
      const textParts: string[] = [];
      for (const child of node.walk()) {
        if (child.type === "text" || child.type === "code") {
          const content = child.attributes["content"] as string | undefined;
          if (content) textParts.push(content);
        }
      }
      const title = textParts.join("");
      const id = title
        .replace(/[?]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase();
      if (title) {
        headings.push({ id, title, level });
      }
    }
  }

  return { content, frontmatter, headings, errors };
}

function parseFrontmatter(raw: string): Record<string, unknown> {
  const lines = raw.split("\n");
  const result: Record<string, unknown> = {};
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match?.[1] && match[2]) {
      result[match[1]] = match[2].trim();
    }
  }
  return result;
}
