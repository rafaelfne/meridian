import Markdoc, {
  type RenderableTreeNode,
  type RenderableTreeNodes,
} from "@markdoc/markdoc";

/**
 * Render a Markdoc tree to HTML, replacing MermaidBlock components with
 * `<pre data-mermaid>` placeholders so the editor preview can hydrate them
 * client-side.
 */
export function renderMarkdocHtml(
  content: RenderableTreeNode | RenderableTreeNodes,
): string {
  const raw = Markdoc.renderers.html(content);

  // Markdoc.renderers.html renders unknown components as <tagname attr="val">children</tagname>
  // MermaidBlock is self-closing (no children) and has a `content` attribute.
  // The output looks like: <mermaidblock content="..."></mermaidblock>
  return raw.replace(
    /<mermaidblock\s+content="([^"]*)"[^>]*><\/mermaidblock>/gi,
    (_match, encoded: string) => {
      const decoded = decodeHtmlEntities(encoded);
      return `<pre class="mermaid-placeholder" data-mermaid="${escapeAttr(decoded)}"><code>${escapeHtml(decoded)}</code></pre>`;
    },
  );
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#10;/g, "\n");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
