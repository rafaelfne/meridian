"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginWithGitHub() {
  await signIn("github", { redirectTo: "/workspaces" });
}

export async function loginWithCredentials(
  _prevState: { success: boolean; error?: string },
  formData: FormData,
) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/workspaces",
    });

    return { success: true as const };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false as const, error: "Invalid email or password." };
    }
    throw error;
  }
}
