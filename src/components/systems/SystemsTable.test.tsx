/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SystemsTable } from "./SystemsTable";
import type { SystemListItemWithServices } from "@/modules/system/types";

// Mock server actions
vi.mock("@/modules/system/actions/update-slugs", () => ({
  updateSlugsAction: vi.fn(),
}));

vi.mock("@/modules/system/actions/create-domain", () => ({
  createDomainAction: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock Radix Select with native HTML elements for testability
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("@/components/ui/select", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  const SelectContext = React.createContext({});

  return {
    Select: ({ children, value, onValueChange }: any) =>
      React.createElement(
        SelectContext.Provider,
        { value: { val: value, onChange: onValueChange, ariaLabel: "" } },
        children,
      ),
    SelectTrigger: ({ children, "aria-label": ariaLabel }: any) => {
      const parent = React.useContext(SelectContext);
      // Store the aria-label for use by SelectContent
      parent.ariaLabel = ariaLabel;
      return children;
    },
    SelectValue: () => null,
    SelectContent: ({ children }: any) => {
      const { val, onChange, ariaLabel } = React.useContext(SelectContext);
      return React.createElement(
        "select",
        {
          value: val,
          onChange: (e: any) => onChange?.(e.target.value),
          ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
        },
        children,
      );
    },
    SelectItem: ({ children, value }: any) =>
      React.createElement("option", { value }, children),
  };
});
/* eslint-enable @typescript-eslint/no-explicit-any */

const mockDomains = [
  { id: "d1", name: "Identity" },
  { id: "d2", name: "Payments" },
];

function createSystem(
  overrides: Partial<SystemListItemWithServices> = {},
): SystemListItemWithServices {
  return {
    id: "s1",
    name: "Auth Service",
    slug: "auth-service",
    language: "TypeScript",
    framework: "NestJS",
    domain: { id: "d1", name: "Identity" },
    _count: { services: 2, databases: 1, integrations: 3, documents: 0 },
    services: [
      { id: "svc1", name: "Auth API", slug: "auth-api", type: "API" },
      { id: "svc2", name: "Auth Worker", slug: "auth-worker", type: "WORKER" },
    ],
    ...overrides,
  };
}

const mockSystems: SystemListItemWithServices[] = [
  createSystem(),
  createSystem({
    id: "s2",
    name: "Payment Gateway",
    slug: "payment-gateway",
    language: "Java",
    framework: "Spring Boot",
    domain: { id: "d2", name: "Payments" },
    _count: { services: 1, databases: 2, integrations: 1, documents: 1 },
    services: [
      { id: "svc3", name: "Payment API", slug: "payment-api", type: "API" },
    ],
  }),
  createSystem({
    id: "s3",
    name: "Billing Engine",
    slug: "billing-engine",
    language: "Go",
    framework: null,
    domain: { id: "d2", name: "Payments" },
    _count: { services: 0, databases: 1, integrations: 0, documents: 0 },
    services: [],
  }),
];

describe("SystemsTable", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders all systems", () => {
    render(
      <SystemsTable
        systems={mockSystems}
        domains={mockDomains}
        workspaceSlug="test-ws"
      />,
    );
    expect(screen.getByText("Auth Service")).toBeInTheDocument();
    expect(screen.getByText("Payment Gateway")).toBeInTheDocument();
    expect(screen.getByText("Billing Engine")).toBeInTheDocument();
  });

  it("renders system name as link to detail page", () => {
    render(
      <SystemsTable
        systems={mockSystems}
        domains={mockDomains}
        workspaceSlug="test-ws"
      />,
    );
    const link = screen.getByText("Auth Service").closest("a");
    expect(link).toHaveAttribute("href", "/w/test-ws/systems/auth-service");
  });

  it("renders domain combobox for each system", () => {
    render(
      <SystemsTable
        systems={mockSystems}
        domains={mockDomains}
        workspaceSlug="test-ws"
      />,
    );
    // Each system row renders a DomainCombobox (Button with role="combobox")
    const comboboxButtons = screen.getAllByRole("combobox").filter(
      (el) => el.tagName === "BUTTON",
    );
    expect(comboboxButtons).toHaveLength(mockSystems.length);
    // Verify domain names are shown in combobox triggers
    expect(comboboxButtons[0]).toHaveTextContent("Identity");
    expect(comboboxButtons[1]).toHaveTextContent("Payments");
    expect(comboboxButtons[2]).toHaveTextContent("Payments");
  });

  it("renders dash for null language", () => {
    const systems = [createSystem({ language: null })];
    render(
      <SystemsTable
        systems={systems}
        domains={mockDomains}
        workspaceSlug="test-ws"
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows empty state when no systems", () => {
    render(
      <SystemsTable
        systems={[]}
        domains={mockDomains}
        workspaceSlug="test-ws"
      />,
    );
    expect(screen.getByText("No systems found")).toBeInTheDocument();
  });

  it("filters systems by search input", () => {
    render(
      <SystemsTable
        systems={mockSystems}
        domains={mockDomains}
        workspaceSlug="test-ws"
      />,
    );

    const searchInput = screen.getByLabelText("Search systems");
    fireEvent.change(searchInput, { target: { value: "auth" } });

    expect(screen.getByText("Auth Service")).toBeInTheDocument();
    expect(screen.queryByText("Payment Gateway")).not.toBeInTheDocument();
    expect(screen.queryByText("Billing Engine")).not.toBeInTheDocument();
  });

  it("shows filter empty state when no matches", () => {
    render(
      <SystemsTable
        systems={mockSystems}
        domains={mockDomains}
        workspaceSlug="test-ws"
      />,
    );

    const searchInput = screen.getByLabelText("Search systems");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    expect(
      screen.getByText("No systems match your filters"),
    ).toBeInTheDocument();
  });

  it("filters systems by domain", () => {
    render(
      <SystemsTable
        systems={mockSystems}
        domains={mockDomains}
        workspaceSlug="test-ws"
      />,
    );

    const domainSelect = screen.getByLabelText("Filter by domain");
    fireEvent.change(domainSelect, { target: { value: "Payments" } });

    expect(screen.queryByText("Auth Service")).not.toBeInTheDocument();
    expect(screen.getByText("Payment Gateway")).toBeInTheDocument();
    expect(screen.getByText("Billing Engine")).toBeInTheDocument();
  });

  it("renders sort buttons for sortable columns", () => {
    render(
      <SystemsTable
        systems={mockSystems}
        domains={mockDomains}
        workspaceSlug="test-ws"
      />,
    );
    expect(screen.getByLabelText("Sort by name")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort by domain")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort by language")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort by framework")).toBeInTheDocument();
  });

  it("renders domain options in the filter dropdown", () => {
    render(
      <SystemsTable
        systems={mockSystems}
        domains={mockDomains}
        workspaceSlug="test-ws"
      />,
    );
    const filterSelect = screen.getByLabelText("Filter by domain");
    const options = filterSelect.querySelectorAll("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("All domains");
    expect(options[1]).toHaveTextContent("Identity");
    expect(options[2]).toHaveTextContent("Payments");
  });

  it("renders system slug inputs with current values", () => {
    render(
      <SystemsTable
        systems={mockSystems}
        domains={mockDomains}
        workspaceSlug="test-ws"
      />,
    );
    const aliasInput = screen.getByLabelText("Alias for Auth Service");
    expect(aliasInput).toHaveValue("auth-service");
  });

  it("expands system row to show services on click", () => {
    render(
      <SystemsTable
        systems={mockSystems}
        domains={mockDomains}
        workspaceSlug="test-ws"
      />,
    );

    // Services should not be visible initially
    expect(screen.queryByText("Auth API")).not.toBeInTheDocument();
    expect(screen.queryByText("Auth Worker")).not.toBeInTheDocument();

    // Click the system row to expand
    fireEvent.click(screen.getByText("Auth Service").closest("tr")!);

    // Services should now be visible
    expect(screen.getByText("Auth API")).toBeInTheDocument();
    expect(screen.getByText("Auth Worker")).toBeInTheDocument();
  });

  it("collapses expanded row on second click", () => {
    render(
      <SystemsTable
        systems={mockSystems}
        domains={mockDomains}
        workspaceSlug="test-ws"
      />,
    );

    const systemRow = screen.getByText("Auth Service").closest("tr")!;

    // Expand
    fireEvent.click(systemRow);
    expect(screen.getByText("Auth API")).toBeInTheDocument();

    // Collapse
    fireEvent.click(systemRow);
    expect(screen.queryByText("Auth API")).not.toBeInTheDocument();
  });

  it("does not expand system with no services", () => {
    render(
      <SystemsTable
        systems={mockSystems}
        domains={mockDomains}
        workspaceSlug="test-ws"
      />,
    );

    const billingRow = screen.getByText("Billing Engine").closest("tr")!;
    fireEvent.click(billingRow);

    // No sub-table should appear (Billing Engine has 0 services)
    expect(screen.queryByText("Service Name")).not.toBeInTheDocument();
  });

  it("shows service slug inputs in expanded sub-table", () => {
    render(
      <SystemsTable
        systems={mockSystems}
        domains={mockDomains}
        workspaceSlug="test-ws"
      />,
    );

    // Expand Auth Service
    fireEvent.click(screen.getByText("Auth Service").closest("tr")!);

    const serviceAliasInput = screen.getByLabelText(
      "Alias for service Auth API",
    );
    expect(serviceAliasInput).toHaveValue("auth-api");
  });

  it("shows confirm button when a slug is edited", () => {
    render(
      <SystemsTable
        systems={mockSystems}
        domains={mockDomains}
        workspaceSlug="test-ws"
      />,
    );

    // No confirm button initially
    expect(screen.queryByText("Confirm")).not.toBeInTheDocument();

    // Edit a system slug
    const aliasInput = screen.getByLabelText("Alias for Auth Service");
    fireEvent.change(aliasInput, { target: { value: "auth-svc" } });

    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("1 change(s) pending")).toBeInTheDocument();
  });

  it("hides confirm button when slug is reverted to original", () => {
    render(
      <SystemsTable
        systems={mockSystems}
        domains={mockDomains}
        workspaceSlug="test-ws"
      />,
    );

    const aliasInput = screen.getByLabelText("Alias for Auth Service");

    // Edit
    fireEvent.change(aliasInput, { target: { value: "auth-svc" } });
    expect(screen.getByText("Confirm")).toBeInTheDocument();

    // Revert
    fireEvent.change(aliasInput, { target: { value: "auth-service" } });
    expect(screen.queryByText("Confirm")).not.toBeInTheDocument();
  });
});
