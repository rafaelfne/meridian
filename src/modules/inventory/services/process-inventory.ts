import type { SystemInventory } from "../types";

export const DEFAULT_DOMAIN_NAME = "Default";

export interface UpsertSystemInput {
  slug: string;
  name: string;
  domainId: string;
  purpose?: string;
  language?: string;
  framework?: string;
  frameworkVersion?: string;
  repositoryUrl?: string;
  inventoryRaw: unknown;
}

export interface ProcessInventoryDeps {
  upsertDomain: (name: string) => Promise<{ id: string }>;
  processSystem: (
    domainId: string,
    system: SystemInventory,
  ) => Promise<{ id: string }>;
}

export interface ProcessInventoryResult {
  systemsProcessed: number;
  errors: string[];
}

export async function processInventory(
  systems: SystemInventory[],
  deps: ProcessInventoryDeps,
): Promise<ProcessInventoryResult> {
  const errors: string[] = [];
  let systemsProcessed = 0;

  const domain = await deps.upsertDomain(DEFAULT_DOMAIN_NAME);

  for (const system of systems) {
    try {
      await deps.processSystem(domain.id, system);
      systemsProcessed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to process system "${system.slug}": ${message}`);
    }
  }

  return { systemsProcessed, errors };
}
