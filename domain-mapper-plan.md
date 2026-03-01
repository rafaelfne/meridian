---
name: Meridian Engineer
description: >
  Implement GitHub issues for Meridian with production-grade Next.js 15 code.
  Build dependency graph visualization, inventory ingestion pipelines, and APIs
  using React Flow, Prisma 6.17.1, Zod, and Auth.js v5. Follow strict domain isolation,
  CSS Modules for component styling, Server Components by default, Server Actions for
  mutations, and comprehensive testing. Always keep the repo buildable, type-safe, and lint-clean.
---

# Meridian — Epics & Issues Plan for GitHub Copilot Agent

**Project:** Meridian (Next.js 15 + React Flow + Prisma 6.17.1 + PostgreSQL)
**Goal:** A tool for ingesting technology inventories (JSON), persisting data in Postgres, and visualizing a dependency map between domains via React Flow.

---

## 1. Copilot Agent — Full Instructions

The block below should be included in the **body of each issue** so the Copilot Agent has full context when executing tasks. Copy the content between the delimiters.

````markdown
> [!NOTE]
> **Copilot Agent Instructions — Meridian**
>
> ## Tech Stack
> - **Framework:** Next.js 15 (App Router, Turbopack, React 19)
> - **Graph Visualization:** React Flow (`@xyflow/react`)
> - **ORM:** Prisma 6.17.1 with PostgreSQL
> - **Validation:** Zod for all input/output schemas
> - **Auth:** Auth.js v5 (next-auth@beta) with Credentials + GitHub providers
> - **Styling:** CSS Modules (`.module.css`) for component-scoped styles + Tailwind CSS for utility/layout only
> - **UI Components:** shadcn/ui (installed via CLI, customized with CSS Modules when needed)
> - **Language:** TypeScript in strict mode (`"strict": true`, `"noUncheckedIndexedAccess": true`)
> - **Testing:** Vitest + React Testing Library + MSW for API mocking
> - **Linting:** ESLint (next/core-web-vitals + typescript-eslint) + Prettier
>
> ## Architecture & Domain Isolation
>
> ```
> src/
> ├── app/                          # Next.js App Router (routes only, thin layer)
> │   ├── (auth)/                   # Route group: login, register
> │   ├── (dashboard)/              # Route group: protected pages
> │   │   ├── dashboard/
> │   │   ├── upload/
> │   │   ├── graph/
> │   │   └── systems/
> │   ├── api/                      # Route Handlers (API endpoints)
> │   │   ├── auth/[...nextauth]/
> │   │   ├── inventories/
> │   │   ├── systems/
> │   │   ├── domains/
> │   │   ├── dependencies/
> │   │   └── graph/
> │   ├── layout.tsx                # Root layout (global providers, global.css)
> │   └── page.tsx                  # Landing / redirect
> │
> ├── modules/                      # Domain modules (business logic isolation)
> │   ├── inventory/                # Inventory ingestion domain
> │   │   ├── actions/              # Server Actions
> │   │   ├── services/             # Business logic (pure functions, no framework deps)
> │   │   ├── validators/           # Zod schemas
> │   │   └── types.ts              # Domain types
> │   ├── graph/                    # Dependency graph domain
> │   │   ├── services/             # Dependency resolvers
> │   │   ├── processors/           # Graph processing engine
> │   │   └── types.ts
> │   └── system/                   # System/domain CRUD
> │       ├── actions/
> │       ├── services/
> │       └── types.ts
> │
> ├── components/                   # UI components
> │   ├── ui/                       # shadcn/ui base components
> │   ├── graph/                    # React Flow components
> │   │   ├── DependencyGraph.tsx
> │   │   ├── DependencyGraph.module.css
> │   │   ├── SystemNode.tsx
> │   │   ├── SystemNode.module.css
> │   │   ├── DependencyEdge.tsx
> │   │   └── GraphControls.tsx
> │   ├── inventory/                # Upload-related components
> │   │   ├── UploadDropzone.tsx
> │   │   ├── UploadDropzone.module.css
> │   │   └── InventoryPreview.tsx
> │   ├── dashboard/                # Dashboard widgets
> │   └── shared/                   # Cross-cutting (Header, Sidebar, etc.)
> │       ├── Header.tsx
> │       └── Header.module.css
> │
> ├── lib/                          # Infrastructure / framework glue
> │   ├── prisma.ts                 # Prisma client singleton
> │   ├── auth.ts                   # Auth.js v5 config (NextAuth)
> │   ├── auth.config.ts            # Auth config (edge-compatible, no adapter)
> │   └── utils.ts                  # Generic utilities (cn, formatters)
> │
> └── types/                        # Shared global types
>     └── index.ts
> ```
>
> ## Coding Standards & Best Practices
>
> ### Server Components vs Client Components
> - **Default to Server Components.** Only add `"use client"` when the component needs:
>   interactivity (onClick, onChange), browser APIs, hooks (useState, useEffect), or context.
> - Server Components fetch data directly via Prisma or Server Actions — never use `useEffect` + `fetch` for initial data.
> - Use `loading.tsx` and `<Suspense>` for streaming, never manual loading states in Server Components.
>
> ### Server Actions
> - All data mutations (create, update, delete) MUST use Server Actions (`"use server"`).
> - Server Actions live in `src/modules/<domain>/actions/` files.
> - Every Server Action must: validate input with Zod, perform the mutation via Prisma, call `revalidatePath()` or `revalidateTag()`, and return a typed result.
> - Pattern:
>   ```typescript
>   "use server";
>   import { revalidatePath } from "next/cache";
>   import { prisma } from "@/lib/prisma";
>   import { InventoryUploadSchema } from "@/modules/inventory/validators";
>
>   export async function uploadInventory(formData: FormData) {
>     const file = formData.get("file") as File;
>     const json = JSON.parse(await file.text());
>     const validated = InventoryUploadSchema.parse(json);
>     // ... persist with prisma.$transaction()
>     revalidatePath("/dashboard");
>     return { success: true, systemsCount: validated.systems.length };
>   }
>   ```
>
> ### CSS Modules (Styling)
> - **Every component with custom styles gets a co-located `.module.css` file.**
> - Naming convention: `ComponentName.module.css` next to `ComponentName.tsx`.
> - Use Tailwind ONLY for layout utilities (flex, grid, padding, margin) and shadcn/ui base.
> - Use CSS Modules for: colors, typography, animations, hover states, component-specific visual logic.
> - Use `clsx` for conditional class composition:
>   ```typescript
>   import styles from "./SystemNode.module.css";
>   import clsx from "clsx";
>
>   <div className={clsx(styles.node, { [styles.highlighted]: isSelected })} />
>   ```
> - **Never use inline styles** except for truly dynamic values (e.g., computed positions in React Flow).
> - **Never use global CSS** except in `app/globals.css` for CSS custom properties and resets.
> - Add TypeScript declarations for CSS Modules in `src/types/css.d.ts`:
>   ```typescript
>   declare module "*.module.css" {
>     const classes: { readonly [key: string]: string };
>     export default classes;
>   }
>   ```
>
> ### Authentication (Auth.js v5)
> - Config split: `auth.config.ts` (edge-compatible, no adapter) + `auth.ts` (full config with Prisma adapter).
> - Route handler in `app/api/auth/[...nextauth]/route.ts` exporting `{ GET, POST } = handlers`.
> - Middleware in `middleware.ts` using `auth.config.ts` for route protection.
> - Protected routes under `(dashboard)` route group.
> - Server-side: `const session = await auth()` in Server Components / Server Actions.
> - Client-side: `<SessionProvider>` in a client wrapper component, `useSession()` in Client Components.
> - Environment: `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`.
>
> ### Domain Isolation & Dependency Injection
> - Business logic lives in `src/modules/<domain>/services/` — pure TypeScript, no Next.js or React imports.
> - Services receive dependencies via function parameters (repository pattern), never import Prisma directly:
>   ```typescript
>   // modules/graph/services/resolve-http-deps.ts
>   export async function resolveHttpDependencies(
>     getAllIntegrations: () => Promise<Integration[]>,
>     getSystemBySlug: (slug: string) => Promise<System | null>,
>   ): Promise<Dependency[]> { ... }
>   ```
> - Wiring happens in Server Actions or Route Handlers (composition root):
>   ```typescript
>   // modules/graph/actions/process.ts
>   "use server";
>   import { resolveHttpDependencies } from "../services/resolve-http-deps";
>   import { prisma } from "@/lib/prisma";
>
>   export async function processDependencies() {
>     return resolveHttpDependencies(
>       () => prisma.integration.findMany(),
>       (slug) => prisma.system.findUnique({ where: { slug } }),
>     );
>   }
>   ```
> - This makes services unit-testable without Prisma or database.
>
> ### Data Fetching & Caching
> - Use `fetch` with `next: { tags: [...] }` for cacheable external data.
> - Use Prisma directly in Server Components for database reads (no API route round-trip).
> - Use `revalidateTag()` and `revalidatePath()` after mutations for cache invalidation.
> - Use `unstable_cache` (or React `cache()`) for expensive computations.
>
> ### Error Handling
> - Use `error.tsx` boundary files per route segment.
> - Server Actions return `{ success: boolean; data?: T; error?: string }` — never throw to the client.
> - Use `notFound()` from `next/navigation` for 404s.
> - Use `redirect()` for auth redirects.
>
> ### Testing
> - **Unit tests** for services in `src/modules/` — test pure business logic with mocked dependencies.
> - **Component tests** with React Testing Library for interactive components.
> - **API tests** with Vitest for Route Handlers (using `NextRequest`/`NextResponse` mocks).
> - Test files co-located: `service.ts` → `service.test.ts` in the same directory.
> - Use `vitest.config.ts` with path aliases matching `tsconfig.json`.
> - Minimum coverage targets: 80% for services, 60% for components.
>
> ### Git & CI Conventions
> - Conventional commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`.
> - One concern per commit. PR title = conventional commit message.
> - CI pipeline: `typecheck → lint → test → build` (all must pass).
> - Branch naming: `feat/issue-{number}-short-description`.
>
> ### Prisma Conventions
> - Schema in `prisma/schema.prisma`.
> - All IDs are `cuid()` strings unless domain requires otherwise.
> - All models have `createdAt` and `updatedAt`.
> - Use `@relation(onDelete: Cascade)` for parent-child relationships.
> - Use `@@unique` for composite business keys.
> - Migrations via `npx prisma migrate dev --name descriptive_name`.
> - Never use raw SQL in application code — only Prisma Client.
>
> ### React Flow Conventions
> - Custom nodes extend `NodeProps` and use `Handle` for connections.
> - Custom edges use `getBezierPath` or `getSmoothStepPath`.
> - Layout computed server-side (dagre/elkjs) and passed as initial positions.
> - State management via `useNodesState` / `useEdgesState`.
> - Minimap, Controls, and Background always included.
````

---

## 2. Epics and Issues

### Epic 1 — Project Bootstrap & Infrastructure

**Goal:** Project scaffold, tooling configuration, local database, auth, and minimal CI.

---

#### Issue 1.1 — Scaffold Next.js 15 project with core dependencies

**Labels:** `epic:bootstrap`, `priority:high`, `copilot-agent`

**Description:**

Create the Next.js 15 project with App Router, Turbopack, and all dependencies. Follow the directory structure defined in the Agent Instructions.

**Acceptance Criteria:**
- [ ] Install dependencies:
  - Core: `@xyflow/react`, `prisma@6.17.1`, `@prisma/client@6.17.1`, `zod`, `clsx`, `react-dropzone`, `lucide-react`
  - Auth: `next-auth@beta`, `@auth/prisma-adapter`
  - Layout: `dagre` (graph layout)
  - Dev: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `msw`, `@vitejs/plugin-react`
- [ ] Configure shadcn/ui (`npx shadcn@latest init`) with components: `button`, `card`, `dialog`, `table`, `badge`, `tabs`, `toast`, `dropdown-menu`, `input`, `sheet`, `separator`
- [ ] `tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess: true`, path alias `@/*` → `src/*`
- [ ] Create the full folder structure per Agent Instructions (including `src/modules/`, `src/components/graph/`, `src/lib/`)
- [ ] `src/types/css.d.ts` with CSS Modules declaration
- [ ] `src/lib/prisma.ts` with singleton pattern (using `globalThis` for dev)
- [ ] `src/lib/utils.ts` with `cn()` function (clsx + twMerge)
- [ ] `.env.example` with all required variables
- [ ] `globals.css` with CSS custom properties for theme tokens (dependency type colors, etc.)
- [ ] Verify that `npm run build` passes without errors

---

#### Issue 1.2 — Docker Compose for local development

**Labels:** `epic:bootstrap`, `priority:high`, `copilot-agent`

**Description:**

Create `docker-compose.yml` for the local development environment.

**Acceptance Criteria:**
- [ ] PostgreSQL 16 with persistent volume, port 5432
- [ ] Variables configurable via `.env`
- [ ] npm scripts: `db:up`, `db:down`, `db:reset` (drop + migrate + seed)
- [ ] `README.md` with setup instructions (3 commands to run locally)
- [ ] Healthcheck configured on the Postgres container

---

#### Issue 1.3 — Prisma schema and initial migrations

**Labels:** `epic:bootstrap`, `priority:high`, `copilot-agent`

**Description:**

Define the complete Prisma schema to persist technology inventory data and the dependency graph. Include Auth.js models.

**Expected schema:**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Auth.js Models ──────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@unique([identifier, token])
}

// ── Domain Models ───────────────────────────────────────

model Domain {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  systems     System[]
}

model System {
  id               String   @id @default(cuid())
  name             String
  slug             String   @unique
  purpose          String?
  language         String?
  framework        String?
  frameworkVersion  String?
  repositoryUrl    String?
  domainId         String
  domain           Domain   @relation(fields: [domainId], references: [id], onDelete: Cascade)
  inventoryRaw     Json?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  services         Service[]
  databases        Database[]
  integrations     Integration[]
  kafkaTopics      KafkaTopic[]
  packages         Package[]
  apiEndpoints     ApiEndpoint[]
  risks            Risk[]
  dependsOn        Dependency[] @relation("DependencySource")
  dependedBy       Dependency[] @relation("DependencyTarget")

  @@unique([domainId, name])
}

model Service {
  id       String      @id @default(cuid())
  name     String
  type     ServiceType
  systemId String
  system   System      @relation(fields: [systemId], references: [id], onDelete: Cascade)
}

enum ServiceType {
  API
  WORKER
  CRONJOB
  BACKGROUND_SERVICE
}

model Database {
  id       String  @id @default(cuid())
  name     String
  provider String
  version  String?
  orm      String?
  tables   Json?
  systemId String
  system   System  @relation(fields: [systemId], references: [id], onDelete: Cascade)
}

model Integration {
  id           String          @id @default(cuid())
  name         String
  type         IntegrationType
  targetSystem String?
  url          String?
  protocol     String?
  systemId     String
  system       System          @relation(fields: [systemId], references: [id], onDelete: Cascade)
}

enum IntegrationType {
  HTTP_API
  DATABASE_DIRECT
  GRPC
  GRAPHQL
  SOAP
  FILE_TRANSFER
  OTHER
}

model KafkaTopic {
  id       String    @id @default(cuid())
  name     String
  role     TopicRole
  systemId String
  system   System    @relation(fields: [systemId], references: [id], onDelete: Cascade)
}

enum TopicRole {
  PRODUCER
  CONSUMER
  BOTH
}

model Package {
  id       String       @id @default(cuid())
  name     String
  version  String?
  scope    PackageScope
  systemId String
  system   System       @relation(fields: [systemId], references: [id], onDelete: Cascade)
}

enum PackageScope {
  INTERNAL
  OPEN_SOURCE
  TEST
}

model ApiEndpoint {
  id          String  @id @default(cuid())
  path        String
  method      String?
  description String?
  systemId    String
  system      System  @relation(fields: [systemId], references: [id], onDelete: Cascade)
}

model Risk {
  id          String   @id @default(cuid())
  title       String
  description String?
  severity    Severity
  systemId    String
  system      System   @relation(fields: [systemId], references: [id], onDelete: Cascade)
}

enum Severity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model Dependency {
  id       String         @id @default(cuid())
  sourceId String
  targetId String
  type     DependencyType
  label    String?
  metadata Json?
  source   System         @relation("DependencySource", fields: [sourceId], references: [id], onDelete: Cascade)
  target   System         @relation("DependencyTarget", fields: [targetId], references: [id], onDelete: Cascade)
  createdAt DateTime      @default(now())

  @@unique([sourceId, targetId, type, label])
}

enum DependencyType {
  HTTP_API
  KAFKA_TOPIC
  SHARED_DATABASE
  CROSS_DATABASE_QUERY
  SHARED_PACKAGE
  GRPC
  FILE_DEPENDENCY
}

model InventoryUpload {
  id           String       @id @default(cuid())
  filename     String
  status       UploadStatus @default(PENDING)
  systemsCount Int          @default(0)
  errors       Json?
  rawPayload   Json
  uploadedById String?
  createdAt    DateTime     @default(now())
  processedAt  DateTime?
}

enum UploadStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

**Acceptance Criteria:**
- [ ] Schema created in `prisma/schema.prisma` with all models above
- [ ] `npx prisma migrate dev --name init` executed successfully
- [ ] `npx prisma generate` without errors
- [ ] Seed in `prisma/seed.ts` with at least 1 domain, 1 system, and example data based on Grifo
- [ ] `npm run db:seed` script configured in `package.json`

---

#### Issue 1.4 — Configure Auth.js v5 with GitHub + Credentials

**Labels:** `epic:bootstrap`, `priority:high`, `copilot-agent`

**Description:**

Configure authentication with Auth.js v5 (next-auth@beta) following the split config pattern for Edge Runtime compatibility.

**Acceptance Criteria:**
- [ ] `src/lib/auth.config.ts` — edge-compatible config (providers, pages, basic callbacks, no adapter)
- [ ] `src/lib/auth.ts` — full config with Prisma adapter, jwt/session callbacks
- [ ] `src/app/api/auth/[...nextauth]/route.ts` — exporting `{ GET, POST }` from handlers
- [ ] `middleware.ts` at root — protecting `(dashboard)` routes using `auth.config.ts`
- [ ] Configured providers: GitHub OAuth + Credentials (email/password with bcrypt)
- [ ] Login page at `src/app/(auth)/login/page.tsx` with form using Server Action
- [ ] `SessionProvider` wrapper in Client Component for `(dashboard)` layout
- [ ] Variables: `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`
- [ ] Extended types in `src/types/next-auth.d.ts` (session with `user.id`)
- [ ] Route `/` redirects to `/dashboard` if authenticated, otherwise to `/login`

---

#### Issue 1.5 — Testing setup (Vitest + RTL + MSW)

**Labels:** `epic:bootstrap`, `priority:medium`, `copilot-agent`

**Description:**

Configure the complete testing stack.

**Acceptance Criteria:**
- [ ] `vitest.config.ts` with path aliases, setup files, environment `jsdom`
- [ ] `vitest.setup.ts` with `@testing-library/jest-dom` imports
- [ ] MSW configured with example handlers for API routes
- [ ] First passing test: Zod validation test in `src/modules/inventory/validators/`
- [ ] npm scripts: `test`, `test:watch`, `test:coverage`
- [ ] GitHub Actions workflow `.github/workflows/ci.yml`: typecheck → lint → test → build

---

### Epic 2 — Inventory Ingestion (Upload & Parsing)

**Goal:** Receive standardized JSON via upload, validate, process, and persist.

---

#### Issue 2.1 — Zod input schema and inventory types

**Labels:** `epic:ingestao`, `priority:high`, `copilot-agent`

**Description:**

Create the Zod schemas that define the JSON input contract for inventories in `src/modules/inventory/validators/`.

**Acceptance Criteria:**
- [ ] Zod schemas in `src/modules/inventory/validators/inventory-schema.ts` (following the pattern in the Agent Instructions section)
- [ ] Inferred types exported in `src/modules/inventory/types.ts`
- [ ] Unit tests covering: valid JSON accepted, missing required fields, invalid enums, slug with invalid characters, empty array rejected
- [ ] `examples/grifo-inventory.json` with real data (see section 6 of this document)

---

#### Issue 2.2 — Upload and persistence Server Action

**Labels:** `epic:ingestao`, `priority:high`, `copilot-agent`

**Description:**

Create the Server Action that receives the JSON file, validates, and persists it to the database.

**Acceptance Criteria:**
- [ ] Server Action `uploadInventory` in `src/modules/inventory/actions/upload.ts`
- [ ] Accepts `FormData` with `file` field (JSON)
- [ ] Validates with `InventoryPayloadSchema`
- [ ] For each system: upsert Domain by name, upsert System by slug, delete + create children in transaction
- [ ] Saves raw JSON in `System.inventoryRaw`
- [ ] Creates `InventoryUpload` record with status tracking
- [ ] Returns `{ success, uploadId, systemsProcessed, errors? }` (never throws)
- [ ] `revalidatePath("/dashboard")` and `revalidatePath("/graph")` after success
- [ ] Unit tests with Prisma mocked via injection

---

#### Issue 2.3 — Upload page with Drag & Drop

**Labels:** `epic:ingestao`, `priority:medium`, `copilot-agent`

**Description:**

`/upload` page with drag & drop interface. Dropzone is a Client Component; page is a Server Component.

**Acceptance Criteria:**
- [ ] `src/app/(dashboard)/upload/page.tsx` — Server Component, fetches recent uploads via Prisma
- [ ] `src/components/inventory/UploadDropzone.tsx` — Client Component with `react-dropzone`
- [ ] `src/components/inventory/UploadDropzone.module.css` — dropzone styles (drag states, hover, idle, error)
- [ ] Accept only `.json`, max 5MB
- [ ] JSON preview before submission (collapsible `<pre>`)
- [ ] Client-side validation with Zod before submission, inline errors
- [ ] Calls Server Action `uploadInventory` via `useActionState`
- [ ] Visual states: idle → validating → uploading → success/error
- [ ] Success feedback: how many systems processed, link to the graph
- [ ] Recent uploads table (last 10) with status badges

---

#### Issue 2.4 — Query Route Handlers (systems, domains, uploads)

**Labels:** `epic:ingestao`, `priority:medium`, `copilot-agent`

**Description:**

Create Route Handlers to query persisted data. Consumed by the graph and dashboard.

**Acceptance Criteria:**
- [ ] `GET /api/systems` — list with domain, counts. Query: `?domain=X`, `?page=1&limit=20`
- [ ] `GET /api/systems/[slug]` — full detail, `?include=services,databases,integrations`
- [ ] `GET /api/domains` — list with system count
- [ ] `GET /api/inventories/uploads` — recent uploads
- [ ] Query params validated with Zod
- [ ] Typed return with `NextResponse.json()`
- [ ] Tests with mocked Prisma

---

### Epic 3 — Dependency Inference Engine

**Goal:** Pure services with DI that process data and generate graph edges.

---

#### Issue 3.1 — HTTP dependency resolver

**Labels:** `epic:graph-engine`, `priority:high`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `src/modules/graph/services/resolve-http-deps.ts`
- [ ] Function receives `getAllIntegrations` and `getSystemBySlug` as parameters (DI)
- [ ] Returns `Dependency[]` with `type: HTTP_API`
- [ ] Unresolved integrations returned in `unresolved[]`
- [ ] Unit tests with injected mocks (zero database deps)

---

#### Issue 3.2 — Kafka dependency resolver

**Labels:** `epic:graph-engine`, `priority:high`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `src/modules/graph/services/resolve-kafka-deps.ts`
- [ ] DI: receives `getAllKafkaTopicsWithSystem`
- [ ] Groups by topic, crosses PRODUCER/BOTH × CONSUMER/BOTH between different systems
- [ ] No self-loops. Label = topic name
- [ ] Unit tests

---

#### Issue 3.3 — Database and package dependency resolver

**Labels:** `epic:graph-engine`, `priority:medium`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `resolve-database-deps.ts` — same DB name+provider across different systems → `SHARED_DATABASE`; Integration DATABASE_DIRECT → `CROSS_DATABASE_QUERY`
- [ ] `resolve-package-deps.ts` — same INTERNAL Package across different systems → `SHARED_PACKAGE`
- [ ] Both with DI. Unit tests.

---

#### Issue 3.4 — Orchestrator and processing Server Action

**Labels:** `epic:graph-engine`, `priority:high`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `src/modules/graph/processors/dependency-processor.ts` — orchestrates all resolvers (pure, receives functions)
- [ ] Server Action `processDependencies` in `src/modules/graph/actions/process.ts` — wiring with Prisma
- [ ] Delete + create within transaction
- [ ] Returns `{ total, byType, unresolved }`
- [ ] Called automatically at the end of `uploadInventory`
- [ ] Route Handler `POST /api/dependencies/process` for manual trigger
- [ ] `revalidatePath("/graph")` after processing
- [ ] Unit tests for the processor + Server Action test

---

### Epic 4 — Graph Visualization with React Flow

---

#### Issue 4.1 — Graph data Route Handler

**Labels:** `epic:graph-ui`, `priority:high`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `GET /api/graph` returns `{ nodes, edges }` formatted for React Flow
- [ ] System → node with `data: { label, domain, language, framework, servicesCount, risksCount, domainColor }`
- [ ] Dependency → edge with `data: { type, label }`, styled by type
- [ ] Positions calculated server-side with dagre
- [ ] Filters: `?domain=X`, `?dependencyType=HTTP_API,KAFKA_TOPIC`

---

#### Issue 4.2 — React Flow component with custom nodes and edges

**Labels:** `epic:graph-ui`, `priority:high`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `DependencyGraph.tsx` (Client) + `DependencyGraph.module.css`
- [ ] `SystemNode.tsx` + `SystemNode.module.css` — name, domain badge, language, risk icon
- [ ] `DependencyEdge.tsx` — colors by type (HTTP=blue, Kafka=green, DB=orange, Package=gray)
- [ ] Dagre layout for initial nodes. MiniMap, Controls, Background.
- [ ] `src/app/(dashboard)/graph/page.tsx` — Server Component that fetches and passes data

---

#### Issue 4.3 — Side detail panel

**Labels:** `epic:graph-ui`, `priority:medium`, `copilot-agent`

**Acceptance Criteria:**
- [ ] Click on node → side Sheet (shadcn)
- [ ] Fetches details via Server Action
- [ ] Tabs: Services, Databases, Integrations, Kafka, Packages, Risks
- [ ] Severity badges, repo link, "highlight dependencies" button
- [ ] `SystemDetail.module.css`

---

#### Issue 4.4 — Filter toolbar and legends

**Labels:** `epic:graph-ui`, `priority:medium`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `GraphToolbar.tsx` + `GraphToolbar.module.css`
- [ ] Filters: domain (multi-select), dependency type (colored checkboxes), language, search
- [ ] Toggle isolated systems. Color legend. Counter.
- [ ] Filters synced with query params (shareable URL)

---

### Epic 5 — Dashboard & Overview

---

#### Issue 5.1 — Dashboard with metrics

**Labels:** `epic:dashboard`, `priority:medium`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `src/app/(dashboard)/dashboard/page.tsx` — Server Component
- [ ] Cards: domains, systems, dependencies, HIGH+CRITICAL risks
- [ ] Language distribution, dependencies by type (simple charts or Recharts)
- [ ] Top 5 most connected systems. Recent risks. Recent uploads.
- [ ] Link to graph. `Dashboard.module.css`

---

#### Issue 5.2 — Systems listing

**Labels:** `epic:dashboard`, `priority:low`, `copilot-agent`

**Acceptance Criteria:**
- [ ] Server-rendered table with search and domain filter
- [ ] Click → `/systems/[slug]` with detail page
- [ ] Client-side sorting

---

### Epic 6 — Quality & Documentation

---

#### Issue 6.1 — CI pipeline

**Labels:** `epic:qualidade`, `priority:medium`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `.github/workflows/ci.yml`: typecheck → lint → test → build (Node 20)
- [ ] Prisma generate before typecheck. Coverage thresholds.
- [ ] Status checks required for merge.

---

#### Issue 6.2 — Documentation

**Labels:** `epic:qualidade`, `priority:low`, `copilot-agent`

**Acceptance Criteria:**
- [ ] README: overview, stack, local setup, screenshots
- [ ] `CONTRIBUTING.md`: conventions, structure, how to add a resolver
- [ ] `docs/json-schema.md`: documented input schema
- [ ] `docs/architecture.md`: Mermaid flow diagram

---

## 3. Execution Sequence

```
Epic 1 (Bootstrap) — sequential
  1.1 → 1.2 → 1.3 → 1.4 → 1.5

Epic 2 (Ingestion) — depends on Epic 1
  2.1 → 2.2 → 2.3 + 2.4 (parallel)

Epic 3 (Graph Engine) — depends on 2.2
  3.1 + 3.2 + 3.3 (parallel) → 3.4

Epic 4 (Visualization) — depends on 3.4
  4.1 → 4.2 → 4.3 + 4.4 (parallel)

Epic 5 (Dashboard) — depends on 2.4 and 4.1
  5.1 → 5.2

Epic 6 (Quality) — CI in parallel since Epic 1, docs at the end
  6.1 (alongside 1.5) → 6.2 (at the end)
```

---

## 4. GitHub Labels

| Label               | Color     | Description                  |
| ------------------- | --------- | ---------------------------- |
| `epic:bootstrap`    | `#0E8A16` | Setup and infrastructure     |
| `epic:ingestao`     | `#1D76DB` | Inventory upload and parsing |
| `epic:graph-engine` | `#D93F0B` | Dependency inference engine  |
| `epic:graph-ui`     | `#7057FF` | React Flow visualization     |
| `epic:dashboard`    | `#FBCA04` | Dashboard and metrics        |
| `epic:qualidade`    | `#B60205` | Tests, CI, docs              |
| `priority:high`     | `#D93F0B` | High priority                |
| `priority:medium`   | `#FBCA04` | Medium priority              |
| `priority:low`      | `#0E8A16` | Low priority                 |
| `copilot-agent`     | `#5319E7` | Task for Copilot Agent       |

---

## 5. Issue Template

Create at `.github/ISSUE_TEMPLATE/copilot-agent-task.md`:

```markdown
---
name: Copilot Agent Task
about: Task for GitHub Copilot Agent Mode execution
title: "[AGENT] "
labels: copilot-agent
assignees: ''
---

> [!NOTE]
> **Copilot Agent Instructions — Meridian**
> (Paste the full block from Section 1 here)

## Description

<!-- Describe the task with clear context -->

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Relevant Files

<!-- Files to create or modify -->

## Dependencies

<!-- Issues that must be completed first -->

## Technical Notes

<!-- Design decisions, edge cases -->
```

---

## 6. Example JSON — Grifo Inventory

File `examples/grifo-inventory.json`:

```json
{
  "systems": [
    {
      "name": "Grifo",
      "slug": "grifo",
      "domain": "Tesouro Direto",
      "purpose": "Position and order management for Tesouro Direto with Sinacor integration",
      "language": "C#",
      "framework": ".NET",
      "frameworkVersion": "9.0",
      "repositoryUrl": "github.com/warrenbrasil/grifo",
      "services": [
        { "name": "Warren.Grifo.Process.Api", "type": "API" },
        { "name": "Warren.Grifo.Process.Background", "type": "WORKER" },
        { "name": "Warren.Grifo.Integration.BackgroundServices", "type": "WORKER" }
      ],
      "databases": [
        {
          "name": "Grifo",
          "provider": "MySQL",
          "version": "8.0",
          "orm": "Entity Framework Core 9.0.5",
          "tables": [
            { "name": "Customer", "primaryKey": "Id" },
            { "name": "CustomerStatus", "primaryKey": "CustomerId" },
            { "name": "Position", "primaryKey": "Id" },
            { "name": "Order", "primaryKey": "Id" },
            { "name": "Bond", "primaryKey": "Id" },
            { "name": "Date", "primaryKey": "Today" },
            { "name": "DataCheck", "primaryKey": "Id" },
            { "name": "DataCheckType", "primaryKey": "Id" },
            { "name": "CustomerProcessing", "primaryKey": "Id" },
            { "name": "PositionExternalSystem", "primaryKey": "Id" }
          ]
        },
        {
          "name": "GrifoIntegration",
          "provider": "MySQL",
          "version": "8.0",
          "orm": "Entity Framework Core + Dapper",
          "tables": [
            { "name": "Position", "primaryKey": "composite" },
            { "name": "Order", "primaryKey": "composite" }
          ]
        },
        {
          "name": "Sinacor",
          "provider": "Oracle",
          "version": "23.5.1",
          "orm": "Dapper",
          "tables": [
            { "name": "CORRWIN.TCFMOVI_TEDI", "primaryKey": "composite" }
          ]
        }
      ],
      "integrations": [
        {
          "name": "Athena API",
          "type": "HTTP_API",
          "targetSystem": "athena",
          "url": "https://athena-api.prd.consolidacao.warren.com.br",
          "protocol": "REST"
        },
        {
          "name": "Inoa Broker Tools",
          "type": "HTTP_API",
          "targetSystem": "inoa-broker-tools",
          "protocol": "REST (cookie-based auth)"
        },
        {
          "name": "Sinacor Oracle Direct",
          "type": "DATABASE_DIRECT",
          "targetSystem": "sinacor",
          "protocol": "Dapper raw SQL"
        },
        {
          "name": "Warren Core Customers API",
          "type": "HTTP_API",
          "targetSystem": "core-customers",
          "protocol": "REST"
        }
      ],
      "kafkaTopics": [
        { "name": "Queueing.DirectTreasury.Grifo.IntegrateCustomer", "role": "BOTH" },
        { "name": "Queueing.DirectTreasury.Grifo.ProcessCustomer", "role": "BOTH" },
        { "name": "Queueing.DirectTreasury.Grifo.ProcessingFinished", "role": "PRODUCER" },
        { "name": "Queueing.DirectTreasury.Grifo.OrderBackfill", "role": "BOTH" }
      ],
      "packages": [
        { "name": "Warren.Core.Infrastructure.Web", "version": "7.0.3", "scope": "INTERNAL" },
        { "name": "Warren.Core.Infrastructure.Background", "version": "6.2.0", "scope": "INTERNAL" },
        { "name": "Warren.Core.Common.Extensions", "version": "2.8.2", "scope": "INTERNAL" },
        { "name": "Warren.Core.Customers.Api.Client", "version": "3.12.1", "scope": "INTERNAL" },
        { "name": "Warren.Core.Slack.Client", "version": "3.1.0", "scope": "INTERNAL" },
        { "name": "Pomelo.EntityFrameworkCore.MySql", "version": "9.0.0-preview.3", "scope": "OPEN_SOURCE" },
        { "name": "Microsoft.EntityFrameworkCore", "version": "9.0.5", "scope": "OPEN_SOURCE" },
        { "name": "Oracle.ManagedDataAccess.Core", "version": "23.5.1", "scope": "OPEN_SOURCE" },
        { "name": "Dapper", "version": "2.1.66", "scope": "OPEN_SOURCE" },
        { "name": "FluentValidation", "version": "12.0.0", "scope": "OPEN_SOURCE" },
        { "name": "xunit", "version": "2.5.3", "scope": "TEST" },
        { "name": "Moq", "version": "4.20.72", "scope": "TEST" },
        { "name": "Bogus", "version": "35.6.3", "scope": "TEST" },
        { "name": "FluentAssertions", "version": "8.2.0", "scope": "TEST" }
      ],
      "apiEndpoints": [
        { "path": "/v1/bonds", "method": "GET", "description": "Fetch/populate bonds from Athena" },
        { "path": "/v1/customers/processings/enqueue", "method": "POST", "description": "Enqueue processing" },
        { "path": "/v1/positions", "method": "GET", "description": "Query positions" },
        { "path": "/v1/orders", "method": "GET", "description": "Query orders" },
        { "path": "/v1/dates", "method": "GET", "description": "Business calendar" },
        { "path": "/v1/data-checks", "method": "GET", "description": "Data checks by customer" },
        { "path": "/v1/reports/ir", "method": "GET", "description": "Income tax report" },
        { "path": "/v1/backfill", "method": "POST", "description": "Trigger order backfill" }
      ],
      "risks": [
        { "title": "Pomelo MySQL preview", "description": "9.0.0-preview.3 — preview dependency in production", "severity": "HIGH" },
        { "title": "Oracle dependency", "description": "Strong coupling with legacy Sinacor infrastructure", "severity": "HIGH" },
        { "title": "Warren.Core version mismatch", "description": "3 versions in the same repo (4.1.0, 6.1.4, 7.0.3)", "severity": "MEDIUM" },
        { "title": "Cross-database queries", "description": "Raw SQL across Grifo and GrifoIntegration schemas", "severity": "MEDIUM" },
        { "title": "No integration tests", "description": "Only unit tests", "severity": "MEDIUM" },
        { "title": "FluentAssertions mismatch", "description": "7.0.0 vs 8.2.0 between solutions", "severity": "LOW" },
        { "title": "RestSharp 106.x deprecated", "description": "Deprecated version but not in use", "severity": "LOW" }
      ]
    }
  ]
}
```
