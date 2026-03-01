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

  const domainCache = new Map<string, string>();

  async function getDomainId(name: string): Promise<string> {
    const cached = domainCache.get(name);
    if (cached) return cached;
    const domain = await deps.upsertDomain(name);
    domainCache.set(name, domain.id);
    return domain.id;
  }

  for (const system of systems) {
    try {
      const domainName = system.domainName ?? DEFAULT_DOMAIN_NAME;
      const domainId = await getDomainId(domainName);
      await deps.processSystem(domainId, system);
      systemsProcessed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to process system "${system.slug}": ${message}`);
    }
  }

  return { systemsProcessed, errors };
}
