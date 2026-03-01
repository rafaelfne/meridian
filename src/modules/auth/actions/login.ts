"use server";

import { signIn } from "@/lib/auth";

export async function loginWithGitHub() {
  await signIn("github", { redirectTo: "/workspaces" });
}
