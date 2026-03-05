/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  act,
  cleanup,
} from "@testing-library/react";
import { UploadDropzone } from "./UploadDropzone";
import type { FileRejection } from "react-dropzone";

type OnDropFn = (accepted: File[], rejected: FileRejection[]) => void;
let capturedOnDrop: OnDropFn;

vi.mock("react-dropzone", () => ({
  useDropzone: (opts: { onDrop: OnDropFn }) => {
    capturedOnDrop = opts.onDrop;
    return {
      getRootProps: () => ({ "data-testid": "dropzone" }),
      getInputProps: () => ({}),
      isDragActive: false,
    };
  },
}));

vi.mock("@/modules/inventory/actions/upload", () => ({
  uploadInventoryAction: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

function createJsonFile(content: unknown, name = "inventory.json"): File {
  const blob = new Blob([JSON.stringify(content)], {
    type: "application/json",
  });
  return new File([blob], name, { type: "application/json" });
}

describe("UploadDropzone", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dropzone with idle state", () => {
    render(<UploadDropzone workspaceId="ws-test-id" workspaceSlug="test-ws" />);
    expect(
      screen.getByText(/drag & drop json inventory files/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/only .json files up to 5 mb each/i),
    ).toBeInTheDocument();
  });

  it("shows validation error for invalid JSON structure", async () => {
    render(<UploadDropzone workspaceId="ws-test-id" workspaceSlug="test-ws" />);
    await act(async () => {
      capturedOnDrop([createJsonFile({ invalid: "data" })], []);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText(/validation error/i)).toBeInTheDocument();
  });

  it("shows file list and submit button for valid JSON", async () => {
    render(<UploadDropzone workspaceId="ws-test-id" workspaceSlug="test-ws" />);
    const file = createJsonFile({
      systems: [{ name: "Auth Service", slug: "auth-service" }],
    });

    await act(async () => {
      capturedOnDrop([file], []);
    });

    await waitFor(() => {
      expect(screen.getByText("inventory.json")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /upload 1 file$/i }),
    ).toBeInTheDocument();
  });

  it("shows multiple files when dropping several valid JSONs", async () => {
    render(<UploadDropzone workspaceId="ws-test-id" workspaceSlug="test-ws" />);
    const file1 = createJsonFile(
      { systems: [{ name: "Auth", slug: "auth" }] },
      "auth.json",
    );
    const file2 = createJsonFile(
      { systems: [{ name: "Core", slug: "core" }] },
      "core.json",
    );

    await act(async () => {
      capturedOnDrop([file1, file2], []);
    });

    await waitFor(() => {
      expect(screen.getByText("auth.json")).toBeInTheDocument();
      expect(screen.getByText("core.json")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /upload 2 files$/i }),
    ).toBeInTheDocument();
  });

  it("shows validation error when systems array is empty", async () => {
    render(<UploadDropzone workspaceId="ws-test-id" workspaceSlug="test-ws" />);
    await act(async () => {
      capturedOnDrop([createJsonFile({ systems: [] })], []);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("shows validation error for malformed JSON text", async () => {
    render(<UploadDropzone workspaceId="ws-test-id" workspaceSlug="test-ws" />);
    const blob = new Blob(["not valid json {{{"], {
      type: "application/json",
    });
    const file = new File([blob], "bad.json", { type: "application/json" });

    await act(async () => {
      capturedOnDrop([file], []);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText("bad.json: Invalid JSON file")).toBeInTheDocument();
  });

  it("shows rejection error for invalid file type", async () => {
    render(<UploadDropzone workspaceId="ws-test-id" workspaceSlug="test-ws" />);
    act(() => {
      capturedOnDrop([], [
        {
          file: new File([""], "readme.txt", { type: "text/plain" }),
          errors: [{ code: "file-invalid-type", message: "Invalid type" }],
        },
      ]);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(
      screen.getByText("readme.txt: Only .json files are accepted"),
    ).toBeInTheDocument();
  });

  it("shows rejection error for oversized file", async () => {
    render(<UploadDropzone workspaceId="ws-test-id" workspaceSlug="test-ws" />);
    act(() => {
      capturedOnDrop([], [
        {
          file: new File([""], "big.json", { type: "application/json" }),
          errors: [{ code: "file-too-large", message: "File is too large" }],
        },
      ]);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(
      screen.getByText("big.json: File size exceeds 5MB limit"),
    ).toBeInTheDocument();
  });
});
