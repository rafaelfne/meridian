import { CodeBlock } from "../markdoc/CodeBlock";
import { Callout } from "../markdoc/Callout";

const MARKDOC_EXAMPLE = `# Service Overview

This document describes the **payments-service** architecture and its integration points.

## Dependencies

The service calls the \`orders-service\` via HTTP to fetch order details before processing payment.

{% callout type="warning" title="Rate limiting" %}
The orders API enforces a 1000 req/min rate limit. Ensure your retry logic uses exponential backoff.
{% /callout %}

## API Endpoints

### POST /payments/charge

Initiates a payment for a given order.

**Request body:**
- \`orderId\` (string) — the order to charge
- \`amount\` (number) — amount in cents
- \`currency\` (string) — ISO 4217 currency code

**Response:** Returns a \`paymentId\` and initial \`status\`.

## Events Emitted

| Event | Broker | When |
|-------|--------|------|
| \`payment.completed\` | Kafka | Payment successfully processed |
| \`payment.failed\` | Kafka | Payment declined or errored |`;

export async function DocumentationFeatureSection() {
  return (
    <section id="documentation">
      <h2>Documentation</h2>
      <p>
        Meridian includes a built-in documentation system that lets teams write and maintain
        technical docs directly alongside their system inventory. Documents are written in{" "}
        <strong>Markdoc</strong>, a powerful Markdown-based authoring format that supports custom
        tags and structured content.
      </p>

      <h3 id="doc-creating">Creating documents</h3>
      <p>
        To create a new document for a system:
      </p>
      <ol>
        <li>
          Navigate to the system detail page (<strong>Systems</strong> → click a system)
        </li>
        <li>
          Click the <strong>Documentation</strong> tab
        </li>
        <li>
          Click <strong>New Document</strong> (visible to EDITOR and OWNER roles)
        </li>
        <li>
          Enter a <strong>title</strong> and a <strong>slug</strong> (URL-safe identifier,
          auto-generated from the title)
        </li>
        <li>Write the document content using Markdoc syntax in the editor</li>
        <li>Save the document</li>
      </ol>
      <Callout type="note" title="Editor role required">
        Only workspace members with the EDITOR or OWNER role can create and edit documents.
        VIEWER members can read all documents without restrictions.
      </Callout>

      <h3 id="doc-viewing">Viewing documents with TOC</h3>
      <p>
        When you open a document, Meridian renders the Markdoc source into a clean reading view.
        The page includes:
      </p>
      <ul>
        <li>
          <strong>Rendered content</strong> — fully formatted text with headings, tables, code
          blocks, lists, and callout boxes
        </li>
        <li>
          <strong>Table of contents sidebar</strong> — automatically generated from the document
          headings (h2 and h3), displayed as a sticky sidebar on the right side of the document.
          Clicking a TOC entry scrolls to that section.
        </li>
        <li>
          <strong>Author and date</strong> — shows the author name and last updated timestamp at
          the top of the document
        </li>
        <li>
          <strong>Edit link</strong> — visible to EDITOR and OWNER members, navigates to the
          editor for that document
        </li>
      </ul>
      <p>
        If the Markdoc source contains syntax errors, a validation warning is displayed at the
        top of the rendered view.
      </p>

      <h3 id="doc-editing">Editing documents</h3>
      <p>
        The document editor provides a text area with Markdoc syntax. Documents support standard
        Markdown features plus Meridian-specific custom tags:
      </p>
      <table>
        <thead>
          <tr>
            <th>Tag</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>{"{% callout type=\"note\" title=\"...\" %}"}</code>
            </td>
            <td>
              Renders a highlighted callout box. Types: <code>note</code>, <code>warning</code>,{" "}
              <code>error</code>, <code>check</code>
            </td>
          </tr>
        </tbody>
      </table>
      <p>Here is an example of a complete system document written in Markdoc:</p>
      <CodeBlock content={MARKDOC_EXAMPLE} language="markdown" />
    </section>
  );
}
