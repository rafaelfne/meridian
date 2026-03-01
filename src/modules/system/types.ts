export interface SystemDetailService {
  id: string;
  name: string;
  type: "API" | "WORKER" | "CRONJOB" | "BACKGROUND_SERVICE";
}

export interface SystemDetailDatabase {
  id: string;
  name: string;
  provider: string;
  version: string | null;
  orm: string | null;
}

export interface SystemDetailIntegration {
  id: string;
  name: string;
  type:
    | "HTTP_API"
    | "DATABASE_DIRECT"
    | "GRPC"
    | "GRAPHQL"
    | "SOAP"
    | "FILE_TRANSFER"
    | "OTHER";
  targetSystem: string | null;
  url: string | null;
}

export interface SystemDetailMessageTopic {
  id: string;
  name: string;
  role: "PRODUCER" | "CONSUMER" | "BOTH";
  broker: "KAFKA" | "RABBITMQ" | "SQS" | "SNS" | "OTHER";
}

export interface SystemDetailPackage {
  id: string;
  name: string;
  version: string | null;
  scope: "INTERNAL" | "OPEN_SOURCE" | "TEST";
}

export interface SystemDetailRisk {
  id: string;
  title: string;
  description: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface SystemDetailApiEndpoint {
  id: string;
  path: string;
  method: string | null;
  description: string | null;
}

export interface SystemDetailDependency {
  id: string;
  type: string;
  label: string | null;
  system: { id: string; name: string; slug: string };
}

export interface SystemDetail {
  id: string;
  name: string;
  slug: string;
  purpose: string | null;
  language: string | null;
  framework: string | null;
  frameworkVersion: string | null;
  repositoryUrl: string | null;
  layer: string | null;
  domain: { name: string };
  services: SystemDetailService[];
  databases: SystemDetailDatabase[];
  integrations: SystemDetailIntegration[];
  messageTopics: SystemDetailMessageTopic[];
  packages: SystemDetailPackage[];
  risks: SystemDetailRisk[];
  apiEndpoints: SystemDetailApiEndpoint[];
  dependsOn: SystemDetailDependency[];
  dependedBy: SystemDetailDependency[];
}

export interface SystemListItem {
  id: string;
  name: string;
  slug: string;
  language: string | null;
  framework: string | null;
  domain: { id: string; name: string };
  _count: {
    services: number;
    databases: number;
    integrations: number;
    documents: number;
  };
}
