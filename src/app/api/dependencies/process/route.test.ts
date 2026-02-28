import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/modules/graph/actions/process", () => ({
  processDependenciesAction: vi.fn(),
}));

import { POST } from "./route";
import { processDependenciesAction } from "@/modules/graph/actions/process";

const mockAction = processDependenciesAction as ReturnType<typeof vi.fn>;

describe("POST /api/dependencies/process", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns processed dependencies result", async () => {
    const mockResult = {
      total: 5,
      byType: { HTTP_API: 3, GRPC: 2 },
      unresolved: 1,
    };
    mockAction.mockResolvedValue(mockResult);

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockResult);
  });

  it("returns 500 on error", async () => {
    mockAction.mockRejectedValue(new Error("DB error"));

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to process dependencies");
    expect(body.details).toBe("DB error");
  });
});
