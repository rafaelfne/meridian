/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { GraphToolbar, type GraphToolbarProps } from "./GraphToolbar";

/* ── Mock Next.js navigation ──────────────────────────────────── */

const mockReplace = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => currentSearchParams,
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/graph",
}));

/* ── Helpers ──────────────────────────────────────────────────── */

const defaultProps: GraphToolbarProps = {
  availableDomains: ["Auth", "Payments", "Analytics"],
  availableLanguages: ["TypeScript", "Java", "Go"],
  totalNodes: 10,
  totalEdges: 8,
  filteredNodes: 7,
  filteredEdges: 5,
};

function renderToolbar(props: Partial<GraphToolbarProps> = {}) {
  return render(<GraphToolbar {...defaultProps} {...props} />);
}

/* ── Tests ─────────────────────────────────────────────────────── */

describe("GraphToolbar", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the toolbar with all sections", () => {
    renderToolbar();

    expect(screen.getByRole("toolbar")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search systems…")).toBeInTheDocument();
    expect(screen.getByText("Domain")).toBeInTheDocument();
    expect(screen.getByText("Dependency Type")).toBeInTheDocument();
    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.getByText("Isolated")).toBeInTheDocument();
  });

  it("displays the counter with correct values", () => {
    renderToolbar();

    expect(screen.getByText(/7 \/ 10 systems/)).toBeInTheDocument();
    expect(screen.getByText(/5 \/ 8/)).toBeInTheDocument();
  });

  it("renders the color legend with all dependency types by default", () => {
    renderToolbar();

    expect(screen.getByText("HTTP API")).toBeInTheDocument();
    expect(screen.getByText("Kafka Topic")).toBeInTheDocument();
    expect(screen.getByText("gRPC")).toBeInTheDocument();
  });

  it("updates search param when typing in the search box", () => {
    renderToolbar();

    const input = screen.getByPlaceholderText("Search systems…");
    fireEvent.change(input, { target: { value: "auth" } });

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("search=auth"),
      { scroll: false },
    );
  });

  it("opens domain dropdown when clicking the Domain button", () => {
    renderToolbar();

    fireEvent.click(screen.getByText("Domain"));

    expect(screen.getByText("Auth")).toBeInTheDocument();
    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });

  it("selects a domain and updates URL", () => {
    renderToolbar();

    fireEvent.click(screen.getByText("Domain"));
    fireEvent.click(screen.getByText("Auth"));

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("domains=Auth"),
      { scroll: false },
    );
  });

  it("opens dependency type dropdown with colored options", () => {
    renderToolbar();

    fireEvent.click(screen.getByText("Dependency Type"));

    expect(screen.getAllByText("HTTP API")).toHaveLength(2); // legend + dropdown
    expect(screen.getAllByText("Kafka Topic")).toHaveLength(2);
  });

  it("toggles isolated systems", () => {
    renderToolbar();

    const isolatedBtn = screen.getByText("Isolated");
    fireEvent.click(isolatedBtn);

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("showIsolated=false"),
      { scroll: false },
    );
  });

  it("hides domain filter when no domains available", () => {
    renderToolbar({ availableDomains: [] });

    expect(screen.queryByText("Domain")).not.toBeInTheDocument();
  });

  it("hides language filter when no languages available", () => {
    renderToolbar({ availableLanguages: [] });

    expect(screen.queryByText("Language")).not.toBeInTheDocument();
  });

  it("shows reset button when filters are active", () => {
    currentSearchParams = new URLSearchParams("search=auth");
    renderToolbar();

    expect(screen.getByLabelText("Reset all filters")).toBeInTheDocument();
  });

  it("does not show reset button when no filters are active", () => {
    renderToolbar();

    expect(screen.queryByLabelText("Reset all filters")).not.toBeInTheDocument();
  });

  it("resets all filters when clicking the reset button", () => {
    currentSearchParams = new URLSearchParams("search=auth&domains=Auth");
    renderToolbar();

    fireEvent.click(screen.getByLabelText("Reset all filters"));

    expect(mockReplace).toHaveBeenCalledWith("/graph", { scroll: false });
  });

  it("reads initial filter state from URL search params", () => {
    currentSearchParams = new URLSearchParams("search=billing");
    renderToolbar();

    const input = screen.getByPlaceholderText(
      "Search systems…",
    ) as HTMLInputElement;
    expect(input.value).toBe("billing");
  });

  it("shows badge count when domains are selected", () => {
    currentSearchParams = new URLSearchParams("domains=Auth,Payments");
    renderToolbar();

    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
