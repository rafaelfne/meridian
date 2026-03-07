"use server";

import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { revalidatePath } from "next/cache";
import {
  DatadogIntegrationSchema,
  SITE_TO_ENUM,
} from "../validators/datadog-integration-schema";
import type { DatadogSite, IntegrationStatus } from "@/generated/prisma/enums";

async function validateCredentials(
  apiKey: string,
  appKey: string,
  site: string,
): Promise<boolean> {
  // Step 1: Validate API key
  const apiResponse = await fetch(`https://api.${site}/api/v1/validate`, {
    method: "GET",
    headers: { "DD-API-KEY": apiKey },
  });
  if (!apiResponse.ok) return false;
  const apiBody = await apiResponse.json();
  if (apiBody.valid !== true) return false;

  // Step 2: Validate app key via an endpoint that requires both
  const appResponse = await fetch(
    `https://api.${site}/api/v1/monitor?page=0&page_size=1`,
    {
      method: "GET",
      headers: {
        "DD-API-KEY": apiKey,
        "DD-APPLICATION-KEY": appKey,
      },
    },
  );
  return appResponse.ok;
}

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

  let isValid = false;
  try {
    isValid = await validateCredentials(apiKey, appKey, site);
  } catch {
    // Network failure — save as invalid
  }

  const status: IntegrationStatus = isValid ? "CONNECTED" : "INVALID";
  const encryptedApiKey = encrypt(apiKey);
  const encryptedAppKey = encrypt(appKey);

  await prisma.datadogIntegration.upsert({
    where: { workspaceId: ctx.workspaceId },
    create: {
      workspaceId: ctx.workspaceId,
      apiKey: encryptedApiKey,
      appKey: encryptedAppKey,
      site: siteEnum,
      status,
      connectedAt: new Date(),
    },
    update: {
      apiKey: encryptedApiKey,
      appKey: encryptedAppKey,
      site: siteEnum,
      status,
      connectedAt: isValid ? new Date() : undefined,
      revokedAt: null,
    },
  });

  revalidatePath(`/w/${workspaceSlug}/settings`);
  return {
    success: true as const,
    status: isValid ? ("connected" as const) : ("invalid" as const),
  };
}
