import { DocsNavbar } from "./DocsNavbar";
import { DocsTableOfContents } from "./DocsTableOfContents";
import { DocContent } from "./DocContent";
import { WorkspacesSection } from "./sections/WorkspacesSection";
import { DashboardSection } from "./sections/DashboardSection";
import { InventoryUploadSection } from "./sections/InventoryUploadSection";
import { GraphViewSection } from "./sections/GraphViewSection";
import { SystemsSection } from "./sections/SystemsSection";
import { DocumentationFeatureSection } from "./sections/DocumentationFeatureSection";
import styles from "./DocsPage.module.css";

const TOC_ITEMS = [
  { id: "workspaces", title: "Workspaces", level: 2 },
  { id: "workspaces-concept", title: "What is a workspace?", level: 3 },
  { id: "workspaces-creation", title: "Creating a workspace", level: 3 },
  { id: "workspaces-roles", title: "Roles & permissions", level: 3 },
  { id: "workspaces-switching", title: "Switching workspaces", level: 3 },
  { id: "dashboard", title: "Dashboard", level: 2 },
  { id: "dashboard-stat-cards", title: "Stat cards", level: 3 },
  { id: "dashboard-charts", title: "Charts", level: 3 },
  { id: "dashboard-top-systems", title: "Top connected systems", level: 3 },
  { id: "dashboard-risks", title: "Risks & uploads", level: 3 },
  { id: "inventory-upload", title: "Inventory Upload", level: 2 },
  { id: "inventory-drag-drop", title: "Drag-and-drop", level: 3 },
  { id: "inventory-schema", title: "JSON schema reference", level: 3 },
  { id: "inventory-example", title: "Complete example", level: 3 },
  { id: "graph-view", title: "Graph View", level: 2 },
  { id: "graph-toolbar", title: "Toolbar & filters", level: 3 },
  { id: "graph-layout-modes", title: "Layout modes", level: 3 },
  { id: "graph-nodes", title: "Node interactions", level: 3 },
  { id: "graph-edge-types", title: "Edge types & colors", level: 3 },
  { id: "graph-edge-interactions", title: "Edge interactions", level: 3 },
  { id: "graph-time-machine", title: "Time machine", level: 3 },
  { id: "graph-command-search", title: "Command search (⌘K)", level: 3 },
  { id: "graph-highlighting", title: "Highlight navigation", level: 3 },
  { id: "systems", title: "Systems", level: 2 },
  { id: "systems-list", title: "Systems list", level: 3 },
  { id: "systems-detail", title: "System detail tabs", level: 3 },
  { id: "documentation", title: "Documentation", level: 2 },
  { id: "doc-creating", title: "Creating documents", level: 3 },
  { id: "doc-viewing", title: "Viewing with TOC", level: 3 },
  { id: "doc-editing", title: "Editing documents", level: 3 },
] as const;

export function DocsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.glowContainer} aria-hidden="true">
        <div className={styles.glowTopLeft} />
        <div className={styles.glowBottomRight} />
      </div>

      <DocsNavbar />

      <div className={styles.hero}>
        <span className={styles.heroLabel}>Documentation</span>
        <h1 className={styles.heroTitle}>Meridian User Guide</h1>
        <p className={styles.heroSubtitle}>
          Everything you need to know to map, visualize, and document your system dependencies.
        </p>
        <hr className={styles.heroDivider} />
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <DocsTableOfContents items={TOC_ITEMS} />
        </aside>
        <main className={styles.main}>
          <DocContent>
            <WorkspacesSection />
            <DashboardSection />
            <InventoryUploadSection />
            <GraphViewSection />
            <SystemsSection />
            <DocumentationFeatureSection />
          </DocContent>
        </main>
      </div>
    </div>
  );
}
