import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ signIn: vi.fn() }));
vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {
    constructor() {
      super("Auth error");
      this.name = "AuthError";
    }
  },
}));

import { loginWithGitHub, loginWithCredentials } from "./login";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

const mockSignIn = signIn as ReturnType<typeof vi.fn>;

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const initial = { success: false };

describe("loginWithGitHub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls signIn with github provider", async () => {
    mockSignIn.mockResolvedValue(undefined);

    await loginWithGitHub();

    expect(mockSignIn).toHaveBeenCalledWith("github", { redirectTo: "/workspaces" });
  });
});

describe("loginWithCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls signIn with credentials and returns success", async () => {
    mockSignIn.mockResolvedValue(undefined);

    const result = await loginWithCredentials(
      initial,
      makeFormData({ email: "john@example.com", password: "Abcdef1234" }),
    );

    expect(result.success).toBe(true);
    expect(mockSignIn).toHaveBeenCalledWith("credentials", {
      email: "john@example.com",
      password: "Abcdef1234",
      redirectTo: "/workspaces",
    });
  });

  it("returns error message on AuthError", async () => {
    mockSignIn.mockRejectedValue(new AuthError());

    const result = await loginWithCredentials(
      initial,
      makeFormData({ email: "john@example.com", password: "wrong" }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password.");
  });

  it("re-throws non-AuthError exceptions", async () => {
    const otherError = new Error("NEXT_REDIRECT");
    mockSignIn.mockRejectedValue(otherError);

    await expect(
      loginWithCredentials(
        initial,
        makeFormData({ email: "john@example.com", password: "pass" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");
  });
});
