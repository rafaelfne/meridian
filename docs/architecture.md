# Architecture

This document describes the high-level architecture of Domain Mapper.

## System Overview

Domain Mapper is a Next.js application that ingests JSON system inventories, automatically resolves inter-system dependencies, and renders an interactive dependency graph.

```mermaid
flowchart LR
    User([User]) -->|uploads JSON| Upload[Upload Dropzone]
    Upload -->|validates| Validator[Zod Validator]
    Validator -->|persists| DB[(PostgreSQL)]
    DB -->|reads| Resolvers[Dependency Resolvers]
    Resolvers -->|writes edges| DB
    DB -->|reads| GraphBuilder[Graph Builder]
    GraphBuilder -->|dagre layout| ReactFlow[React Flow Canvas]
    ReactFlow -->|renders| User
```

## Request Flow

### Inventory Upload

```mermaid
sequenceDiagram
    participant U as User
    participant UI as UploadDropzone
    participant SA as Server Action
    participant Z as Zod Validator
    participant P as Prisma
    participant DB as PostgreSQL

    U->>UI: Drop JSON file
    UI->>SA: uploadInventory(formData)
    SA->>Z: InventoryUploadSchema.parse(json)
    Z-->>SA: validated systems[]
    SA->>P: $transaction (upsert domain, system, relations)
    P->>DB: INSERT / UPSERT
    DB-->>P: OK
    P-->>SA: created records
    SA-->>UI: { success, systemsCount }
    SA->>SA: revalidatePath("/dashboard")
```

### Dependency Resolution

```mermaid
sequenceDiagram
    participant API as POST /api/dependencies/process
    participant HTTP as resolveHttpDeps
    participant MSG as resolveMessagingDeps
    participant DBS as resolveDatabaseDeps
    participant PKG as resolvePackageDeps
    participant P as Prisma
    participant DB as PostgreSQL

    API->>HTTP: resolve(deps)
    API->>MSG: resolve(deps)
    API->>DBS: resolve(deps)
    API->>PKG: resolve(deps)
    HTTP-->>API: DependencyResult[]
    MSG-->>API: DependencyResult[]
    DBS-->>API: DependencyResult[]
    PKG-->>API: DependencyResult[]
    API->>P: upsert dependencies
    P->>DB: INSERT ON CONFLICT
```

### Graph Rendering

```mermaid
sequenceDiagram
    participant U as User
    participant Page as /graph page
    participant API as GET /api/graph
    participant Filter as filterGraphData
    participant Builder as buildGraphData
    participant Dagre as dagre layout
    participant RF as React Flow

    U->>Page: navigate to /graph
    Page->>API: fetch(?domain=X&dependencyType=HTTP_API)
    API->>Filter: apply domain/type filters
    Filter->>Builder: systems[], dependencies[]
    Builder->>Dagre: compute LTR positions
    Dagre-->>Builder: positioned nodes
    Builder-->>API: { nodes, edges }
    API-->>Page: GraphData JSON
    Page->>RF: render nodes & edges
    RF-->>U: interactive canvas
```

## Module Architecture

```mermaid
flowchart TB
    subgraph App ["app/ — Routes"]
        Routes["Pages & API Routes"]
    end

    subgraph Modules ["modules/ — Business Logic"]
        Inventory["inventory/"]
        Graph["graph/"]
        System["system/"]
        Dashboard["dashboard/"]
    end

    subgraph Components ["components/ — UI"]
        GraphUI["graph/ (React Flow)"]
        InvUI["inventory/ (Upload)"]
        SharedUI["shared/ (Header, etc.)"]
    end

    subgraph Lib ["lib/ — Infrastructure"]
        Prisma["prisma.ts"]
        Auth["auth.ts"]
    end

    Routes --> Modules
    Routes --> Components
    Modules --> Lib
    Components --> Modules
```

## Domain Modules

Each module under `src/modules/` owns its business logic and follows the same structure:

| Module        | Responsibility |
| ------------- | -------------- |
| `inventory`   | Parse and persist JSON system inventories. Validates input via Zod, processes systems in a Prisma transaction. |
| `graph`       | Resolve dependencies across systems (HTTP, messaging, database, package) and build React Flow graph data with dagre layout. |
| `system`      | CRUD operations for systems and domains. |
| `dashboard`   | Aggregate metrics for the dashboard view. |
| `auth`        | Authentication helpers. |

### Dependency Resolvers

The graph module contains four specialized resolvers, each as a pure function with injected dependencies:

| Resolver                    | Detects                                                |
| --------------------------- | ------------------------------------------------------ |
| `resolveHttpDependencies`   | `HTTP_API` edges from integration records              |
| `resolveMessagingDeps`      | `KAFKA_TOPIC`, `RABBITMQ_QUEUE`, `SQS_QUEUE` edges from shared message topics |
| `resolveDatabaseDeps`       | `SHARED_DATABASE` edges from matching database names   |
| `resolvePackageDeps`        | `SHARED_PACKAGE` edges from matching internal packages |

All resolvers receive data-access functions (not Prisma directly), making them unit-testable without a database.

## Data Model (simplified)

```mermaid
erDiagram
    Domain ||--o{ System : contains
    System ||--o{ Service : has
    System ||--o{ Database : has
    System ||--o{ Integration : has
    System ||--o{ MessageTopic : has
    System ||--o{ Package : has
    System ||--o{ ApiEndpoint : has
    System ||--o{ Risk : has
    System ||--o{ Dependency : "dependsOn (source)"
    System ||--o{ Dependency : "dependedBy (target)"
```

See `prisma/schema.prisma` for the full schema definition.

## Authentication

```mermaid
flowchart LR
    subgraph Edge ["Middleware (Edge)"]
        AuthConfig["auth.config.ts"]
    end

    subgraph Server ["Server"]
        AuthFull["auth.ts + Prisma Adapter"]
    end

    Request([Request]) --> Edge
    Edge -->|public route| Allow([Allow])
    Edge -->|protected route| AuthCheck{Authenticated?}
    AuthCheck -->|yes| Allow
    AuthCheck -->|no| Redirect([→ /login])

    LoginPage([Login Page]) --> AuthFull
    AuthFull -->|Credentials| Bcrypt["bcrypt verify"]
    AuthFull -->|GitHub| OAuth["GitHub OAuth"]
    Bcrypt --> JWT["JWT Session"]
    OAuth --> JWT
```

- **Edge middleware** (`middleware.ts`) uses the lightweight `auth.config.ts` to protect routes under `(dashboard)`.
- **Full auth config** (`auth.ts`) includes the Prisma adapter for persisting OAuth accounts and uses JWT sessions.
- Providers: **Credentials** (email + bcrypt password) and **GitHub** OAuth.
