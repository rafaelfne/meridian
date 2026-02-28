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

export interface SystemDetail {
  id: string;
  name: string;
  slug: string;
  purpose: string | null;
  language: string | null;
  framework: string | null;
  frameworkVersion: string | null;
  repositoryUrl: string | null;
  domain: { name: string };
  services: SystemDetailService[];
  databases: SystemDetailDatabase[];
  integrations: SystemDetailIntegration[];
  messageTopics: SystemDetailMessageTopic[];
  packages: SystemDetailPackage[];
  risks: SystemDetailRisk[];
}
