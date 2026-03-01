/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SystemsTable } from "./SystemsTable";
import type { SystemListItem } from "@/modules/system/types";

// Mock Radix Select with native HTML elements for testability
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("@/components/ui/select", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  const SelectContext = React.createContext<any>({});

  return {
    Select: ({ children, value, onValueChange }: any) =>
      React.createElement(
        SelectContext.Provider,
        { value: { val: value, onChange: onValueChange } },
        children,
      ),
    SelectTrigger: () => null,
    SelectValue: () => null,
    SelectContent: ({ children }: any) => {
      const { val, onChange } = React.useContext(SelectContext);
      return React.createElement(
        "select",
        {
          value: val,
          onChange: (e: any) => onChange?.(e.target.value),
          "aria-label": "Filter by domain",
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

function createSystem(overrides: Partial<SystemListItem> = {}): SystemListItem {
  return {
    id: "s1",
    name: "Auth Service",
    slug: "auth-service",
    language: "TypeScript",
    framework: "NestJS",
    domain: { id: "d1", name: "Identity" },
    _count: { services: 2, databases: 1, integrations: 3 },
    ...overrides,
  };
}

const mockSystems: SystemListItem[] = [
  createSystem(),
  createSystem({
    id: "s2",
    name: "Payment Gateway",
    slug: "payment-gateway",
    language: "Java",
    framework: "Spring Boot",
    domain: { id: "d2", name: "Payments" },
    _count: { services: 1, databases: 2, integrations: 1 },
  }),
  createSystem({
    id: "s3",
    name: "Billing Engine",
    slug: "billing-engine",
    language: "Go",
    framework: null,
    domain: { id: "d2", name: "Payments" },
    _count: { services: 0, databases: 1, integrations: 0 },
  }),
];

describe("SystemsTable", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders all systems", () => {
    render(<SystemsTable systems={mockSystems} domains={mockDomains} />);
    expect(screen.getByText("Auth Service")).toBeInTheDocument();
    expect(screen.getByText("Payment Gateway")).toBeInTheDocument();
    expect(screen.getByText("Billing Engine")).toBeInTheDocument();
  });

  it("renders system name as link to detail page", () => {
    render(<SystemsTable systems={mockSystems} domains={mockDomains} />);
    const link = screen.getByText("Auth Service").closest("a");
    expect(link).toHaveAttribute("href", "/systems/auth-service");
  });

  it("renders domain badges", () => {
    render(<SystemsTable systems={mockSystems} domains={mockDomains} />);
    // Each domain badge in the table + 1 option in the dropdown
    expect(screen.getAllByText("Identity").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Payments").length).toBeGreaterThanOrEqual(2);
  });

  it("renders counts correctly", () => {
    render(
      <SystemsTable systems={[mockSystems[0]!]} domains={mockDomains} />,
    );
    expect(screen.getByText("2")).toBeInTheDocument(); // services
    expect(screen.getByText("1")).toBeInTheDocument(); // databases
    expect(screen.getByText("3")).toBeInTheDocument(); // integrations
  });

  it("renders dash for null language", () => {
    const systems = [createSystem({ language: null })];
    render(<SystemsTable systems={systems} domains={mockDomains} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows empty state when no systems", () => {
    render(<SystemsTable systems={[]} domains={mockDomains} />);
    expect(screen.getByText("No systems found")).toBeInTheDocument();
  });

  it("filters systems by search input", () => {
    render(<SystemsTable systems={mockSystems} domains={mockDomains} />);

    const searchInput = screen.getByLabelText("Search systems");
    fireEvent.change(searchInput, { target: { value: "auth" } });

    expect(screen.getByText("Auth Service")).toBeInTheDocument();
    expect(screen.queryByText("Payment Gateway")).not.toBeInTheDocument();
    expect(screen.queryByText("Billing Engine")).not.toBeInTheDocument();
  });

  it("shows filter empty state when no matches", () => {
    render(<SystemsTable systems={mockSystems} domains={mockDomains} />);

    const searchInput = screen.getByLabelText("Search systems");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    expect(
      screen.getByText("No systems match your filters"),
    ).toBeInTheDocument();
  });

  it("filters systems by domain", () => {
    render(<SystemsTable systems={mockSystems} domains={mockDomains} />);

    const domainSelect = screen.getByLabelText("Filter by domain");
    fireEvent.change(domainSelect, { target: { value: "Payments" } });

    expect(screen.queryByText("Auth Service")).not.toBeInTheDocument();
    expect(screen.getByText("Payment Gateway")).toBeInTheDocument();
    expect(screen.getByText("Billing Engine")).toBeInTheDocument();
  });

  it("renders sort buttons for sortable columns", () => {
    render(<SystemsTable systems={mockSystems} domains={mockDomains} />);
    expect(screen.getByLabelText("Sort by name")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort by domain")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort by language")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort by framework")).toBeInTheDocument();
  });

  it("sorts systems by name descending on click", () => {
    render(<SystemsTable systems={mockSystems} domains={mockDomains} />);

    // Default is name ascending, click once more to switch to descending
    fireEvent.click(screen.getByLabelText("Sort by name"));

    const rows = screen.getAllByRole("row");
    // row 0 is the header, rows 1-3 are data
    expect(rows[1]).toHaveTextContent("Payment Gateway");
    expect(rows[2]).toHaveTextContent("Billing Engine");
    expect(rows[3]).toHaveTextContent("Auth Service");
  });

  it("sorts systems by domain on click", () => {
    render(<SystemsTable systems={mockSystems} domains={mockDomains} />);

    fireEvent.click(screen.getByLabelText("Sort by domain"));

    const rows = screen.getAllByRole("row");
    // Identity comes before Payments alphabetically
    expect(rows[1]).toHaveTextContent("Auth Service");
  });

  it("renders domain options in the filter dropdown", () => {
    render(<SystemsTable systems={mockSystems} domains={mockDomains} />);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3); // "All domains" + 2 domains
    expect(options[0]).toHaveTextContent("All domains");
    expect(options[1]).toHaveTextContent("Identity");
    expect(options[2]).toHaveTextContent("Payments");
  });
});
