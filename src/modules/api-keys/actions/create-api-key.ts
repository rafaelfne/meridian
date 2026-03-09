"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";
import { generateApiKey } from "@/lib/tokens";
import {
  CreateApiKeySchema,
  type ApiKeyExpiry,
} from "../validators/api-key-schema";

const EXPIRY_MS: Record<ApiKeyExpiry, number | null> = {
  never: null,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
  "1y": 365 * 24 * 60 * 60 * 1000,
};

export async function createApiKey(
  workspaceSlug: string,
  formData: FormData,
) {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "OWNER");

  const parsed = CreateApiKeySchema.safeParse({
    name: formData.get("name"),
    expires: formData.get("expires"),
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const activeCount = await prisma.apiKey.count({
    where: {
      workspaceId: ctx.workspaceId,
      revokedAt: null,
    },
  });

  if (activeCount >= 10) {
    return {
      success: false as const,
      error: {
        name: [
          "Maximum of 10 active API keys per workspace. Revoke an existing key first.",
        ],
      },
    };
  }

  const { raw, prefix, hash } = generateApiKey();

  const expiryMs = EXPIRY_MS[parsed.data.expires];
  const expiresAt = expiryMs ? new Date(Date.now() + expiryMs) : null;

  await prisma.apiKey.create({
    data: {
      workspaceId: ctx.workspaceId,
      name: parsed.data.name,
      keyHash: hash,
      keyPrefix: prefix,
      expiresAt,
      createdBy: ctx.userId,
    },
  });

  revalidatePath(`/w/${workspaceSlug}/settings`);
  return {
    success: true as const,
    data: { raw },
  };
}
