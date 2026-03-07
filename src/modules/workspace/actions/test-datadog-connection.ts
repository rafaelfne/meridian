"use server";

import { requireWorkspaceAccess } from "@/lib/workspace-context";
import { DatadogIntegrationSchema } from "../validators/datadog-integration-schema";

async function validateApiKey(
  apiKey: string,
  site: string,
): Promise<boolean> {
  const response = await fetch(`https://api.${site}/api/v1/validate`, {
    method: "GET",
    headers: { "DD-API-KEY": apiKey },
  });
  if (!response.ok) return false;
  const body = await response.json();
  return body.valid === true;
}

async function validateAppKey(
  apiKey: string,
  appKey: string,
  site: string,
): Promise<boolean> {
  const response = await fetch(
    `https://api.${site}/api/v1/monitor?page=0&page_size=1`,
    {
      method: "GET",
      headers: {
        "DD-API-KEY": apiKey,
        "DD-APPLICATION-KEY": appKey,
      },
    },
  );
  return response.ok;
}

export async function testDatadogConnection(
  workspaceSlug: string,
  formData: FormData,
) {
  await requireWorkspaceAccess(workspaceSlug, "OWNER");

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

  try {
    const apiKeyValid = await validateApiKey(apiKey, site);
    if (!apiKeyValid) {
      return {
        success: false as const,
        error: {
          apiKey: ["Invalid API key. Please check and try again."],
        },
      };
    }

    const appKeyValid = await validateAppKey(apiKey, appKey, site);
    if (!appKeyValid) {
      return {
        success: false as const,
        error: {
          appKey: ["Invalid Application key. Please check and try again."],
        },
      };
    }

    return { success: true as const };
  } catch {
    return {
      success: false as const,
      error: {
        apiKey: [
          "Could not reach Datadog. Please check your site selection and try again.",
        ],
      },
    };
  }
}
