import { describe, it, expect } from "vitest";
import { renderMarkdocSource } from "./render-markdoc";

describe("renderMarkdocSource", () => {
  it("renders basic Markdoc content", () => {
    const source = `# Hello World

This is a paragraph.`;

    const result = renderMarkdocSource(source);

    expect(result.content).toBeDefined();
    expect(result.errors).toHaveLength(0);
    expect(result.headings).toHaveLength(1);
    expect(result.headings[0]).toEqual({
      id: "hello-world",
      title: "Hello World",
      level: 1,
    });
  });

  it("extracts multiple headings at different levels", () => {
    const source = `# Main Title

## Section One

### Subsection

## Section Two`;

    const result = renderMarkdocSource(source);

    expect(result.headings).toHaveLength(4);
    expect(result.headings[0]).toEqual({
      id: "main-title",
      title: "Main Title",
      level: 1,
    });
    expect(result.headings[1]).toEqual({
      id: "section-one",
      title: "Section One",
      level: 2,
    });
    expect(result.headings[2]).toEqual({
      id: "subsection",
      title: "Subsection",
      level: 3,
    });
    expect(result.headings[3]).toEqual({
      id: "section-two",
      title: "Section Two",
      level: 2,
    });
  });

  it("handles empty string input", () => {
    const result = renderMarkdocSource("");

    expect(result.content).toBeDefined();
    expect(result.errors).toHaveLength(0);
    expect(result.headings).toHaveLength(0);
    expect(result.frontmatter).toEqual({});
  });

  it("parses frontmatter", () => {
    const source = `---
title: My Document
author: John
---

# Content`;

    const result = renderMarkdocSource(source);

    expect(result.frontmatter).toEqual({
      title: "My Document",
      author: "John",
    });
  });

  it("returns errors for invalid custom tags", () => {
    const source = `# Test

{% invalid-tag /%}`;

    const result = renderMarkdocSource(source);

    // Markdoc should report an error for unknown tags
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("handles callout tag without errors", () => {
    const source = `# Test

{% callout type="warning" title="Important" %}
This is a warning.
{% /callout %}`;

    const result = renderMarkdocSource(source);

    expect(result.errors).toHaveLength(0);
    expect(result.content).toBeDefined();
  });

  it("handles api-endpoint tag without errors", () => {
    const source = `# API

{% api-endpoint method="GET" path="/v1/users" description="List users" /%}`;

    const result = renderMarkdocSource(source);

    expect(result.errors).toHaveLength(0);
  });

  it("handles system-ref tag without errors", () => {
    const source = `Depends on {% system-ref slug="auth-service" label="Auth Service" /%}.`;

    const result = renderMarkdocSource(source);

    expect(result.errors).toHaveLength(0);
  });

  it("strips question marks from heading ids", () => {
    const source = `# What is this?`;

    const result = renderMarkdocSource(source);

    expect(result.headings[0]?.id).toBe("what-is-this");
  });
});
