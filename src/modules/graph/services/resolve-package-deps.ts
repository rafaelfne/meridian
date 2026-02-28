import type { DependencyResult, PackageRecord } from "../types";

export interface ResolvePackageDepsDeps {
  getAllPackages: () => Promise<PackageRecord[]>;
}

/**
 * Resolves shared-package dependencies across systems.
 *
 * Only INTERNAL packages are considered. When the same package name appears
 * across different systems, pair-wise SHARED_PACKAGE dependencies are created.
 */
export async function resolvePackageDeps(
  deps: ResolvePackageDepsDeps,
): Promise<DependencyResult[]> {
  const results: DependencyResult[] = [];

  const packages = await deps.getAllPackages();

  const pkgGroups = new Map<string, Set<string>>();

  for (const pkg of packages) {
    if (pkg.scope !== "INTERNAL") continue;

    let systems = pkgGroups.get(pkg.name);
    if (!systems) {
      systems = new Set<string>();
      pkgGroups.set(pkg.name, systems);
    }
    systems.add(pkg.systemId);
  }

  for (const [pkgName, systemIds] of pkgGroups) {
    if (systemIds.size < 2) continue;

    const sorted = [...systemIds].sort();

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        results.push({
          sourceId: sorted[i]!,
          targetId: sorted[j]!,
          type: "SHARED_PACKAGE",
          label: pkgName,
        });
      }
    }
  }

  return results;
}
