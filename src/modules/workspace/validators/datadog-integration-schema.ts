import { z } from "zod";

export const DATADOG_SITES = [
  "datadoghq.com",
  "datadoghq.eu",
  "us3.datadoghq.com",
  "us5.datadoghq.com",
] as const;

export type DatadogSiteValue = (typeof DATADOG_SITES)[number];

export const SITE_TO_ENUM: Record<DatadogSiteValue, string> = {
  "datadoghq.com": "DATADOGHQ_COM",
  "datadoghq.eu": "DATADOGHQ_EU",
  "us3.datadoghq.com": "US3_DATADOGHQ_COM",
  "us5.datadoghq.com": "US5_DATADOGHQ_COM",
};

export const ENUM_TO_SITE: Record<string, DatadogSiteValue> = {
  DATADOGHQ_COM: "datadoghq.com",
  DATADOGHQ_EU: "datadoghq.eu",
  US3_DATADOGHQ_COM: "us3.datadoghq.com",
  US5_DATADOGHQ_COM: "us5.datadoghq.com",
};

export const DatadogIntegrationSchema = z.object({
  apiKey: z
    .string()
    .min(1, "API key is required")
    .max(200, "API key is too long"),
  appKey: z
    .string()
    .min(1, "Application key is required")
    .max(200, "Application key is too long"),
  site: z.enum(DATADOG_SITES),
});
