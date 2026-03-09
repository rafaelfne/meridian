"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";
import { RevokeApiKeySchema } from "../validators/api-key-schema";

export async function revokeApiKey(
  workspaceSlug: string,
  formData: FormData,
) {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "OWNER");

  const parsed = RevokeApiKeySchema.safeParse({
    keyId: formData.get("keyId"),
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const key = await prisma.apiKey.findFirst({
    where: {
      id: parsed.data.keyId,
      workspaceId: ctx.workspaceId,
      revokedAt: null,
    },
  });

  if (!key) {
    return {
      success: false as const,
      error: { keyId: ["API key not found or already revoked."] },
    };
  }

  await prisma.apiKey.update({
    where: { id: key.id },
    data: { revokedAt: new Date() },
  });

  revalidatePath(`/w/${workspaceSlug}/settings`);
  return { success: true as const };
}
