"use server";

import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";
import {
  DatadogIntegrationSchema,
  SITE_TO_ENUM,
} from "../validators/datadog-integration-schema";
import type { DatadogSite } from "@/generated/prisma/enums";

export async function saveDatadogIntegration(
  workspaceSlug: string,
  formData: FormData,
) {
  const ctx = await requireWorkspaceAccess(workspaceSlug, "OWNER");

  const parsed = DatadogIntegrationSchema.safeParse({
    apiKey: formData.get("apiKey"),
    appKey: formData.get("appKey"),
    site: formData.get("site"),
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const { apiKey, appKey, site } = parsed.data;
  const siteEnum = SITE_TO_ENUM[site] as DatadogSite;
  const encryptedApiKey = encrypt(apiKey);
  const encryptedAppKey = encrypt(appKey);

  await prisma.datadogIntegration.upsert({
    where: { workspaceId: ctx.workspaceId },
    create: {
      workspaceId: ctx.workspaceId,
      apiKey: encryptedApiKey,
      appKey: encryptedAppKey,
      site: siteEnum,
      status: "CONNECTED",
      connectedAt: new Date(),
    },
    update: {
      apiKey: encryptedApiKey,
      appKey: encryptedAppKey,
      site: siteEnum,
      status: "CONNECTED",
      connectedAt: new Date(),
      revokedAt: null,
    },
  });

  revalidatePath(`/w/${workspaceSlug}/settings`);
  return {
    success: true as const,
    status: "connected" as const,
  };
}
