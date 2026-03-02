/**
 * Generates a kebab-case slug from a service name.
 *
 * Handles two naming conventions:
 * 1. **.NET dotted PascalCase** — e.g. `"Warren.Core.API.Cash"` → `"api-cash"`
 *    Strips known namespace prefixes (`Warren`, `Core`) and converts PascalCase to kebab-case.
 * 2. **Already kebab-case** — e.g. `"oms-api"` → `"oms-api"` (returned as-is).
 */

const NAMESPACE_PREFIXES = new Set(["warren", "core"]);

/**
 * Convert a PascalCase string to kebab-case.
 * `ProcessPortfolio` → `process-portfolio`
 * `API` → `api`
 * `FixedIncome` → `fixed-income`
 */
function pascalToKebab(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

/**
 * Check whether a name is already in kebab-case format (no dots, already lowercase).
 */
function isKebabCase(name: string): boolean {
  return !name.includes(".") && name === name.toLowerCase();
}

/**
 * Generate a slug from a service name.
 *
 * @param name - The raw service name (e.g. `"Warren.Core.API.Cash"` or `"oms-api"`)
 * @returns A kebab-case slug suitable for lookup (e.g. `"api-cash"` or `"oms-api"`)
 */
export function generateServiceSlug(name: string): string {
  if (isKebabCase(name)) return name;

  const segments = name.split(".");

  // Strip leading segments that match known namespace prefixes
  let startIndex = 0;
  while (
    startIndex < segments.length - 1 &&
    NAMESPACE_PREFIXES.has(segments[startIndex]!.toLowerCase())
  ) {
    startIndex++;
  }

  const meaningful = segments.slice(startIndex);

  return meaningful.map(pascalToKebab).join("-");
}
