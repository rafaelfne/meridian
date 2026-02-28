/** Lightweight record types used by graph resolver functions (no Prisma imports). */

export interface DatabaseRecord {
  name: string;
  provider: string;
  systemId: string;
}

export interface IntegrationRecord {
  name: string;
  type: string;
  targetSystem: string | null;
  systemId: string;
}

export interface PackageRecord {
  name: string;
  scope: "INTERNAL" | "OPEN_SOURCE" | "TEST";
  systemId: string;
}

export interface DependencyResult {
  sourceId: string;
  targetId: string;
  type: "SHARED_DATABASE" | "CROSS_DATABASE_QUERY" | "SHARED_PACKAGE";
  label?: string;
}
