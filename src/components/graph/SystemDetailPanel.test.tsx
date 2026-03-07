/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from "@testing-library/react";
import { SystemDetailPanel } from "./SystemDetailPanel";
import type { SystemDetail } from "@/modules/system/types";

/* ── Mocks ─────────────────────────────────────────────── */

// Mock CSS module import (noop)
vi.mock("./SystemDetailPanel.module.css", () => ({
  default: new Proxy(
    {},
    { get: (_target, prop) => (typeof prop === "string" ? prop : "") },
  ),
}));

// Mock the Server Action
const mockGetSystemDetail = vi.fn();
vi.mock("@/modules/system/actions/get-system-detail", () => ({
  getSystemDetailAction: (...args: unknown[]) =>
    mockGetSystemDetail(...args),
}));

// Mock radix-ui Dialog (used by Sheet) for portal rendering in jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("radix-ui", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");

  return {
    Dialog: {
      Root: ({ children, open, onOpenChange }: any) =>
        open
          ? React.createElement(
            "div",
            {
              "data-testid": "sheet-root",
              onClick: () => onOpenChange?.(false),
            },
            children,
          )
          : null,
      Portal: ({ children }: any) => children,
      Overlay: ({ children }: any) =>
        React.createElement("div", null, children),
      Content: ({ children }: any) =>
        React.createElement(
          "div",
          { "data-testid": "sheet-content" },
          children,
        ),
      Close: ({ children, ...props }: any) =>
        React.createElement(
          "button",
          { "data-testid": "sheet-close", ...props },
          children,
        ),
      Title: ({ children }: any) =>
        React.createElement("h2", null, children),
      Description: ({ children }: any) =>
        React.createElement("p", null, children),
      Trigger: ({ children }: any) =>
        React.createElement("button", null, children),
    },
    Tabs: {
      Root: ({ children, defaultValue, ...props }: any) => {
        const [value, setValue] = React.useState(defaultValue);
        return React.createElement(
          (React as any).TabsContext?.Provider ?? "div",
          null,
          React.createElement(
            "div",
            { "data-testid": "tabs-root", ...props },
            typeof children === "function"
              ? children({ value, onValueChange: setValue })
              : React.Children.map(children, (child: any) =>
                child
                  ? React.cloneElement(child, {
                    __tabsValue: value,
                    __tabsOnChange: setValue,
                  })
                  : null,
              ),
          ),
        );
      },
      List: ({ children, __tabsValue, __tabsOnChange, ...props }: any) =>
        React.createElement(
          "div",
          { role: "tablist", ...props },
          React.Children.map(children, (child: any) =>
            child
              ? React.cloneElement(child, {
                __tabsValue,
                __tabsOnChange,
              })
              : null,
          ),
        ),
      Trigger: ({
        children,
        value,
        __tabsValue,
        __tabsOnChange,
        ...props
      }: any) =>
        React.createElement(
          "button",
          {
            role: "tab",
            "aria-selected": __tabsValue === value,
            "data-state": __tabsValue === value ? "active" : "inactive",
            onClick: () => __tabsOnChange?.(value),
            ...props,
          },
          children,
        ),
      Content: ({
        children,
        value,
        __tabsValue,
        __tabsOnChange: _onTabsChange, // eslint-disable-line @typescript-eslint/no-unused-vars
        ...props
      }: any) => {
        // Only render content for the active tab
        if (__tabsValue !== value) return null;
        return React.createElement(
          "div",
          { role: "tabpanel", ...props },
          children,
        );
      },
    },
    Slot: {
      Root: ({ children }: any) => children,
    },
  };
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// Mock lucide-react icons as simple inline SVGs
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("lucide-react", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  const icon = (name: string) =>
    function MockIcon(props: any) {
      return React.createElement("svg", {
        "data-testid": `icon-${name}`,
        ...props,
      });
    };
  return {
    ExternalLink: icon("external-link"),
    Loader2: icon("loader2"),
    Server: icon("server"),
    Database: icon("database"),
    Globe: icon("globe"),
    Radio: icon("radio"),
    Package: icon("package"),
    AlertTriangle: icon("alert-triangle"),
    Highlighter: icon("highlighter"),
    Copy: icon("copy"),
    ArrowRight: icon("arrow-right"),
    ArrowLeft: icon("arrow-left"),
    Route: icon("route"),
    FileText: icon("file-text"),
    XIcon: icon("x"),
  };
});
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ── Test data ─────────────────────────────────────────── */

const mockSystemDetail: SystemDetail = {
  id: "sys-1",
  name: "Auth Service",
  slug: "auth-service",
  purpose: "Handles authentication",
  language: "TypeScript",
  framework: "Next.js",
  frameworkVersion: "15.0.0",
  repositoryUrl: "https://github.com/org/auth-service",
  layer: null,
  domain: { name: "Identity" },
  services: [
    { id: "svc-1", name: "Auth API", slug: "auth-api", type: "API" as const, datadogServiceTag: null },
    { id: "svc-2", name: "Token Worker", slug: "token-worker", type: "WORKER" as const, datadogServiceTag: null },
  ],
  databases: [
    {
      id: "db-1",
      name: "auth_db",
      provider: "PostgreSQL",
      version: "15",
      orm: "Prisma",
    },
  ],
  integrations: [
    {
      id: "intg-1",
      name: "User Service",
      type: "HTTP_API" as const,
      targetSystem: "user-service",
      url: "https://user.api",
    },
  ],
  messageTopics: [
    {
      id: "mt-1",
      name: "user.created",
      role: "PRODUCER" as const,
      broker: "KAFKA" as const,
    },
  ],
  packages: [
    {
      id: "pkg-1",
      name: "zod",
      version: "3.22.0",
      scope: "OPEN_SOURCE" as const,
    },
  ],
  risks: [
    {
      id: "risk-1",
      title: "Low Priority Issue",
      description: "Minor thing",
      severity: "LOW" as const,
    },
    {
      id: "risk-2",
      title: "Critical Vulnerability",
      description: "Needs immediate fix",
      severity: "CRITICAL" as const,
    },
    {
      id: "risk-3",
      title: "Medium Risk",
      description: null,
      severity: "MEDIUM" as const,
    },
  ],
  apiEndpoints: [
    {
      id: "ep-1",
      path: "/api/v1/auth/login",
      method: "POST",
      description: "Authenticate user",
    },
  ],
  dependsOn: [
    {
      id: "dep-1",
      type: "HTTP_API",
      label: "User Query",
      system: { id: "sys-2", name: "User Service", slug: "user-service" },
    },
  ],
  dependedBy: [
    {
      id: "dep-2",
      type: "HTTP_API",
      label: "Auth Check",
      system: { id: "sys-3", name: "API Gateway", slug: "api-gateway" },
    },
  ],
};

/* ── Helpers ───────────────────────────────────────────── */

const noop = () => { };

/**
 * Creates a deferred promise that tests can resolve/reject on demand.
 * Useful for controlling when the async action completes.
 */
function createDeferred<T>() {
  let resolve!: (val: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/* ── Tests ─────────────────────────────────────────────── */

describe("SystemDetailPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /* ─── 1. Does not render when systemId is null ──────── */
  it("does not render when systemId is null", () => {
    render(
      <SystemDetailPanel systemId={null} onClose={noop} workspaceSlug="test-ws" />,
    );

    expect(screen.queryByTestId("sheet-root")).not.toBeInTheDocument();
  });

  /* ─── 2. Shows loading state when fetching ─────────── */
  it("shows loading state when fetching", async () => {
    const deferred = createDeferred<{
      success: boolean;
      data?: SystemDetail;
    }>();
    mockGetSystemDetail.mockReturnValue(deferred.promise);

    render(
      <SystemDetailPanel systemId="sys-1" onClose={noop} workspaceSlug="test-ws" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
    expect(screen.getByText("Fetching system details")).toBeInTheDocument();

    // Clean up: resolve the pending promise so the effect settles
    await act(async () => {
      deferred.resolve({ success: true, data: mockSystemDetail });
    });
  });

  /* ─── 3. Shows error state when action fails ────────── */
  it("shows error state when action fails", async () => {
    mockGetSystemDetail.mockResolvedValue({
      success: false,
      error: "System not found",
    });

    render(
      <SystemDetailPanel systemId="sys-1" onClose={noop} workspaceSlug="test-ws" />,
    );

    await waitFor(() => {
      expect(screen.getByText("System not found")).toBeInTheDocument();
    });

    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(
      screen.getByText("Could not load system details"),
    ).toBeInTheDocument();
  });

  /* ─── 4. Shows system details when loaded ───────────── */
  it("shows system details when loaded", async () => {
    mockGetSystemDetail.mockResolvedValue({
      success: true,
      data: mockSystemDetail,
    });

    render(
      <SystemDetailPanel systemId="sys-1" onClose={noop} workspaceSlug="test-ws" />,
    );

    // System name appears in header title
    await waitFor(() => {
      expect(screen.getByText("Auth Service")).toBeInTheDocument();
    });

    // Domain badge
    expect(screen.getByText("Identity")).toBeInTheDocument();

    // Language and framework in metadata
    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Framework")).toBeInTheDocument();
    expect(screen.getByText("Next.js 15.0.0")).toBeInTheDocument();

    // Repository link with target="_blank"
    const repoLink = screen.getByText(
      (content) => content.includes("github.com/org/auth-service"),
    );
    expect(repoLink.closest("a")).toHaveAttribute("target", "_blank");
    expect(repoLink.closest("a")).toHaveAttribute(
      "href",
      "https://github.com/org/auth-service",
    );
  });

  /* ─── 5. Renders services tab content ───────────────── */
  it("renders services tab content", async () => {
    mockGetSystemDetail.mockResolvedValue({
      success: true,
      data: mockSystemDetail,
    });

    render(
      <SystemDetailPanel systemId="sys-1" onClose={noop} workspaceSlug="test-ws" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Auth Service")).toBeInTheDocument();
    });

    // Default tab is "deps", switch to services tab
    fireEvent.click(screen.getByRole("tab", { name: /svc/i }));

    // Services items should be visible
    await waitFor(() => {
      expect(screen.getByText("auth-api")).toBeInTheDocument();
    });
    expect(screen.getByText("token-worker")).toBeInTheDocument();

    // Type badges
    expect(screen.getByText("API")).toBeInTheDocument();
    expect(screen.getByText("Worker")).toBeInTheDocument();
  });

  /* ─── 6. Renders risks tab sorted by severity ──────── */
  it("renders risks tab sorted by severity (CRITICAL first)", async () => {
    mockGetSystemDetail.mockResolvedValue({
      success: true,
      data: mockSystemDetail,
    });

    render(
      <SystemDetailPanel systemId="sys-1" onClose={noop} workspaceSlug="test-ws" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Auth Service")).toBeInTheDocument();
    });

    // Click the Risks tab
    const risksTab = screen.getByRole("tab", { name: /risks/i });
    fireEvent.click(risksTab);

    await waitFor(() => {
      expect(
        screen.getByText("Critical Vulnerability"),
      ).toBeInTheDocument();
    });

    // All risks should be visible
    expect(screen.getByText("Medium Risk")).toBeInTheDocument();
    expect(screen.getByText("Low Priority Issue")).toBeInTheDocument();

    // Severity badges present
    expect(screen.getByText("CRITICAL")).toBeInTheDocument();
    expect(screen.getByText("MEDIUM")).toBeInTheDocument();
    expect(screen.getByText("LOW")).toBeInTheDocument();

    // Verify CRITICAL appears before LOW in the DOM
    const riskItems = screen
      .getAllByText(/Critical Vulnerability|Medium Risk|Low Priority Issue/)
      .map((el) => el.textContent);
    expect(riskItems).toEqual([
      "Critical Vulnerability",
      "Medium Risk",
      "Low Priority Issue",
    ]);
  });

  /* ─── 7. Shows empty state for tabs with no items ───── */
  it("shows empty state for tabs with no items", async () => {
    const emptyDetail: SystemDetail = {
      ...mockSystemDetail,
      services: [],
      databases: [],
      integrations: [],
      messageTopics: [],
      packages: [],
      risks: [],
    };

    mockGetSystemDetail.mockResolvedValue({
      success: true,
      data: emptyDetail,
    });

    render(
      <SystemDetailPanel systemId="sys-1" onClose={noop} workspaceSlug="test-ws" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Auth Service")).toBeInTheDocument();
    });

    // Default tab is "deps" — switch to services tab to check empty state
    fireEvent.click(screen.getByRole("tab", { name: /svc/i }));
    await waitFor(() => {
      expect(screen.getByText("No services found")).toBeInTheDocument();
    });

    // Switch to databases tab
    fireEvent.click(screen.getByRole("tab", { name: /dbs/i }));
    await waitFor(() => {
      expect(screen.getByText("No databases found")).toBeInTheDocument();
    });

    // Switch to integrations tab
    fireEvent.click(screen.getByRole("tab", { name: /int\b/i }));
    await waitFor(() => {
      expect(
        screen.getByText("No integrations found"),
      ).toBeInTheDocument();
    });

    // Switch to kafka tab
    fireEvent.click(screen.getByRole("tab", { name: /kafka/i }));
    await waitFor(() => {
      expect(
        screen.getByText("No message topics found"),
      ).toBeInTheDocument();
    });

    // Switch to packages tab
    fireEvent.click(screen.getByRole("tab", { name: /pkg/i }));
    await waitFor(() => {
      expect(screen.getByText("No packages found")).toBeInTheDocument();
    });

    // Switch to risks tab
    fireEvent.click(screen.getByRole("tab", { name: /risks/i }));
    await waitFor(() => {
      expect(screen.getByText("No risks found")).toBeInTheDocument();
    });
  });

  /* ─── 8. Calls onHighlightDependencies on click ─────── */
  it("calls onHighlightDependencies when button clicked", async () => {
    mockGetSystemDetail.mockResolvedValue({
      success: true,
      data: mockSystemDetail,
    });

    const handleHighlight = vi.fn();

    render(
      <SystemDetailPanel
        systemId="sys-1"
        onClose={noop}
        onHighlightDependencies={handleHighlight}
        workspaceSlug="test-ws"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Auth Service")).toBeInTheDocument();
    });

    // Pick the footer button (last) to avoid ambiguity with header quick-action
    const highlightButtons = screen.getAllByRole("button", {
      name: /highlight dependencies/i,
    });
    fireEvent.click(highlightButtons[highlightButtons.length - 1]!);

    expect(handleHighlight).toHaveBeenCalledOnce();
    expect(handleHighlight).toHaveBeenCalledWith("sys-1");
  });

  /* ─── 9. Calls onClose when sheet is closed ─────────── */
  it("calls onClose when sheet is closed", async () => {
    mockGetSystemDetail.mockResolvedValue({
      success: true,
      data: mockSystemDetail,
    });

    const handleClose = vi.fn();

    render(
      <SystemDetailPanel
        systemId="sys-1"
        onClose={handleClose}
        workspaceSlug="test-ws"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Auth Service")).toBeInTheDocument();
    });

    // Click the sheet root to trigger onOpenChange(false)
    const sheetRoot = screen.getByTestId("sheet-root");
    fireEvent.click(sheetRoot);

    expect(handleClose).toHaveBeenCalledOnce();
  });
});
