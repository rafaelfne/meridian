export interface Integration {
  id: string;
  name: string;
  type: string;
  targetSystem: string | null;
  url: string | null;
  protocol: string | null;
  systemId: string;
}

export interface System {
  id: string;
  slug: string;
  name: string;
}

export interface Dependency {
  sourceId: string;
  targetId: string;
  type: "HTTP_API";
  label: string | null;
  metadata: Record<string, unknown> | null;
}

export interface UnresolvedIntegration {
  integrationId: string;
  integrationName: string;
  sourceSystemId: string;
  targetSystemSlug: string | null;
  reason: string;
}

export interface ResolveHttpDepsResult {
  resolved: Dependency[];
  unresolved: UnresolvedIntegration[];
}
