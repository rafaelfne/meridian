---
name: Domain Mapper Engineer
description: >
  Implement GitHub issues for Domain Mapper with production-grade Next.js 15 code.
  Build dependency graph visualization, inventory ingestion pipelines, and APIs
  using React Flow, Prisma 6.17.1, Zod, and Auth.js v5. Follow strict domain isolation,
  CSS Modules for component styling, Server Components by default, Server Actions for
  mutations, and comprehensive testing. Always keep the repo buildable, type-safe, and lint-clean.
---

# Domain Mapper — Plano de Epics & Issues para GitHub Copilot Agent

**Projeto:** Domain Mapper (Next.js 15 + React Flow + Prisma 6.17.1 + PostgreSQL)
**Objetivo:** Ferramenta para ingestão de inventários tecnológicos (JSON), persistência em Postgres e visualização de mapa de dependências entre domínios via React Flow.

---

## 1. Copilot Agent — Instruções Completas

O bloco abaixo deve ser incluído no **corpo de cada issue** para que o Copilot Agent tenha contexto completo ao executar tarefas. Copie o conteúdo entre os delimitadores.

````markdown
> [!NOTE]
> **Copilot Agent Instructions — Domain Mapper**
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

## 2. Epics e Issues

### Epic 1 — Project Bootstrap & Infraestrutura

**Objetivo:** Scaffold do projeto, configuração de ferramentas, banco local, auth e CI mínimo.

---

#### Issue 1.1 — Scaffold do projeto Next.js 15 com dependências core

**Labels:** `epic:bootstrap`, `priority:high`, `copilot-agent`

**Descrição:**

Criar o projeto Next.js 15 com App Router, Turbopack, e todas as dependências. Seguir a estrutura de diretórios definida no Agent Instructions.

**Acceptance Criteria:**
- [ ] Instalar dependências:
  - Core: `@xyflow/react`, `prisma@6.17.1`, `@prisma/client@6.17.1`, `zod`, `clsx`, `react-dropzone`, `lucide-react`
  - Auth: `next-auth@beta`, `@auth/prisma-adapter`
  - Layout: `dagre` (graph layout)
  - Dev: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `msw`, `@vitejs/plugin-react`
- [ ] Configurar shadcn/ui (`npx shadcn@latest init`) com componentes: `button`, `card`, `dialog`, `table`, `badge`, `tabs`, `toast`, `dropdown-menu`, `input`, `sheet`, `separator`
- [ ] `tsconfig.json` com `strict: true`, `noUncheckedIndexedAccess: true`, path alias `@/*` → `src/*`
- [ ] Criar toda a estrutura de pastas conforme Agent Instructions (incluindo `src/modules/`, `src/components/graph/`, `src/lib/`)
- [ ] `src/types/css.d.ts` com declaração para CSS Modules
- [ ] `src/lib/prisma.ts` com singleton pattern (usando `globalThis` para dev)
- [ ] `src/lib/utils.ts` com função `cn()` (clsx + twMerge)
- [ ] `.env.example` com todas as variáveis necessárias
- [ ] `globals.css` com CSS custom properties para theme tokens (cores dos tipos de dependência, etc.)
- [ ] Verificar que `npm run build` passa sem erros

---

#### Issue 1.2 — Docker Compose para desenvolvimento local

**Labels:** `epic:bootstrap`, `priority:high`, `copilot-agent`

**Descrição:**

Criar `docker-compose.yml` para ambiente de desenvolvimento local.

**Acceptance Criteria:**
- [ ] PostgreSQL 16 com volume persistente, porta 5432
- [ ] Variáveis configuráveis via `.env`
- [ ] Scripts npm: `db:up`, `db:down`, `db:reset` (drop + migrate + seed)
- [ ] `README.md` com instruções de setup (3 comandos para rodar localmente)
- [ ] Healthcheck configurado no container Postgres

---

#### Issue 1.3 — Schema Prisma e migrations iniciais

**Labels:** `epic:bootstrap`, `priority:high`, `copilot-agent`

**Descrição:**

Definir o schema Prisma completo para persistir dados de inventários tecnológicos e o grafo de dependências. Incluir models para Auth.js.

**Schema esperado:**

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
- [ ] Schema criado em `prisma/schema.prisma` com todos os models acima
- [ ] `npx prisma migrate dev --name init` executado com sucesso
- [ ] `npx prisma generate` sem erros
- [ ] Seed em `prisma/seed.ts` com ao menos 1 domínio, 1 sistema, e dados de exemplo baseados no Grifo
- [ ] Script `npm run db:seed` configurado no `package.json`

---

#### Issue 1.4 — Configurar Auth.js v5 com GitHub + Credentials

**Labels:** `epic:bootstrap`, `priority:high`, `copilot-agent`

**Descrição:**

Configurar autenticação com Auth.js v5 (next-auth@beta) seguindo o padrão split config para compatibilidade com Edge Runtime.

**Acceptance Criteria:**
- [ ] `src/lib/auth.config.ts` — config edge-compatible (providers, pages, callbacks básicos, sem adapter)
- [ ] `src/lib/auth.ts` — config completa com Prisma adapter, jwt/session callbacks
- [ ] `src/app/api/auth/[...nextauth]/route.ts` — exportando `{ GET, POST }` dos handlers
- [ ] `middleware.ts` na raiz — protegendo rotas `(dashboard)` usando `auth.config.ts`
- [ ] Providers configurados: GitHub OAuth + Credentials (email/password com bcrypt)
- [ ] Página de login em `src/app/(auth)/login/page.tsx` com form usando Server Action
- [ ] `SessionProvider` wrapper em Client Component para `(dashboard)` layout
- [ ] Variáveis: `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`
- [ ] Tipos estendidos em `src/types/next-auth.d.ts` (session com `user.id`)
- [ ] Rota `/` redireciona para `/dashboard` se autenticado, senão para `/login`

---

#### Issue 1.5 — Setup de testes (Vitest + RTL + MSW)

**Labels:** `epic:bootstrap`, `priority:medium`, `copilot-agent`

**Descrição:**

Configurar o stack de testes completo.

**Acceptance Criteria:**
- [ ] `vitest.config.ts` com path aliases, setup files, environment `jsdom`
- [ ] `vitest.setup.ts` com imports do `@testing-library/jest-dom`
- [ ] MSW configurado com handlers de exemplo para API routes
- [ ] Primeiro teste passando: teste de validação Zod em `src/modules/inventory/validators/`
- [ ] Scripts npm: `test`, `test:watch`, `test:coverage`
- [ ] GitHub Actions workflow `.github/workflows/ci.yml`: typecheck → lint → test → build

---

### Epic 2 — Ingestão de Inventários (Upload & Parsing)

**Objetivo:** Receber JSON padronizado via upload, validar, processar e persistir.

---

#### Issue 2.1 — Schema Zod de entrada e tipos do inventário

**Labels:** `epic:ingestao`, `priority:high`, `copilot-agent`

**Descrição:**

Criar os schemas Zod que definem o contrato JSON de entrada dos inventários em `src/modules/inventory/validators/`.

**Acceptance Criteria:**
- [ ] Schemas Zod em `src/modules/inventory/validators/inventory-schema.ts` (conforme padrão na seção de Agent Instructions)
- [ ] Types inferidos exportados em `src/modules/inventory/types.ts`
- [ ] Testes unitários cobrindo: JSON válido aceito, campos obrigatórios faltando, enums inválidos, slug com caracteres inválidos, array vazio rejeitado
- [ ] `examples/grifo-inventory.json` com dados reais (ver seção 6 deste documento)

---

#### Issue 2.2 — Server Action de upload e persistência

**Labels:** `epic:ingestao`, `priority:high`, `copilot-agent`

**Descrição:**

Criar o Server Action que recebe o arquivo JSON, valida e persiste no banco.

**Acceptance Criteria:**
- [ ] Server Action `uploadInventory` em `src/modules/inventory/actions/upload.ts`
- [ ] Aceita `FormData` com campo `file` (JSON)
- [ ] Valida com `InventoryPayloadSchema`
- [ ] Para cada system: upsert Domain por nome, upsert System por slug, delete + create filhos em transaction
- [ ] Salva JSON raw em `System.inventoryRaw`
- [ ] Cria registro `InventoryUpload` com status tracking
- [ ] Retorna `{ success, uploadId, systemsProcessed, errors? }` (never throws)
- [ ] `revalidatePath("/dashboard")` e `revalidatePath("/graph")` após sucesso
- [ ] Testes unitários com Prisma mockado via injeção

---

#### Issue 2.3 — Página de Upload com Drag & Drop

**Labels:** `epic:ingestao`, `priority:medium`, `copilot-agent`

**Descrição:**

Página `/upload` com interface de drag & drop. Dropzone é Client Component; page é Server Component.

**Acceptance Criteria:**
- [ ] `src/app/(dashboard)/upload/page.tsx` — Server Component, busca uploads recentes via Prisma
- [ ] `src/components/inventory/UploadDropzone.tsx` — Client Component com `react-dropzone`
- [ ] `src/components/inventory/UploadDropzone.module.css` — estilos do dropzone (drag states, hover, idle, error)
- [ ] Aceitar apenas `.json`, max 5MB
- [ ] Preview do JSON antes do envio (collapsible `<pre>`)
- [ ] Validação client-side com Zod antes do envio, erros inline
- [ ] Chama Server Action `uploadInventory` via `useActionState`
- [ ] Estados visuais: idle → validating → uploading → success/error
- [ ] Feedback de sucesso: quantos sistemas processados, link para o grafo
- [ ] Tabela de uploads recentes (últimos 10) com status badges

---

#### Issue 2.4 — Route Handlers de consulta (sistemas, domínios, uploads)

**Labels:** `epic:ingestao`, `priority:medium`, `copilot-agent`

**Descrição:**

Criar Route Handlers para consultar dados persistidos. Consumidos pelo grafo e dashboard.

**Acceptance Criteria:**
- [ ] `GET /api/systems` — lista com domínio, counts. Query: `?domain=X`, `?page=1&limit=20`
- [ ] `GET /api/systems/[slug]` — detalhe completo, `?include=services,databases,integrations`
- [ ] `GET /api/domains` — lista com count de sistemas
- [ ] `GET /api/inventories/uploads` — uploads recentes
- [ ] Query params validados com Zod
- [ ] Retorno tipado com `NextResponse.json()`
- [ ] Testes com Prisma mockado

---

### Epic 3 — Motor de Inferência de Dependências

**Objetivo:** Services puros com DI que processam dados e geram arestas do grafo.

---

#### Issue 3.1 — Resolver de dependências HTTP

**Labels:** `epic:graph-engine`, `priority:high`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `src/modules/graph/services/resolve-http-deps.ts`
- [ ] Função recebe `getAllIntegrations` e `getSystemBySlug` como parâmetros (DI)
- [ ] Retorna `Dependency[]` com `type: HTTP_API`
- [ ] Integrações não resolvidas retornadas em `unresolved[]`
- [ ] Testes unitários com mocks injetados (zero deps de banco)

---

#### Issue 3.2 — Resolver de dependências Kafka

**Labels:** `epic:graph-engine`, `priority:high`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `src/modules/graph/services/resolve-kafka-deps.ts`
- [ ] DI: recebe `getAllKafkaTopicsWithSystem`
- [ ] Agrupa por tópico, cruza PRODUCER/BOTH × CONSUMER/BOTH entre sistemas diferentes
- [ ] Sem self-loops. Label = nome do tópico
- [ ] Testes unitários

---

#### Issue 3.3 — Resolver de dependências DB e pacotes

**Labels:** `epic:graph-engine`, `priority:medium`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `resolve-database-deps.ts` — mesmo DB name+provider em sistemas ≠ → `SHARED_DATABASE`; Integration DATABASE_DIRECT → `CROSS_DATABASE_QUERY`
- [ ] `resolve-package-deps.ts` — mesmo Package INTERNAL entre sistemas ≠ → `SHARED_PACKAGE`
- [ ] Ambos com DI. Testes unitários.

---

#### Issue 3.4 — Orquestrador e Server Action de processamento

**Labels:** `epic:graph-engine`, `priority:high`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `src/modules/graph/processors/dependency-processor.ts` — orquestra todos os resolvers (puro, recebe funções)
- [ ] Server Action `processDependencies` em `src/modules/graph/actions/process.ts` — wiring com Prisma
- [ ] Delete + create dentro de transaction
- [ ] Retorna `{ total, byType, unresolved }`
- [ ] Chamado automaticamente no final de `uploadInventory`
- [ ] Route Handler `POST /api/dependencies/process` para trigger manual
- [ ] `revalidatePath("/graph")` após processamento
- [ ] Testes unitários no processor + teste do Server Action

---

### Epic 4 — Visualização do Grafo com React Flow

---

#### Issue 4.1 — Route Handler de dados do grafo

**Labels:** `epic:graph-ui`, `priority:high`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `GET /api/graph` retorna `{ nodes, edges }` formatados para React Flow
- [ ] System → nó com `data: { label, domain, language, framework, servicesCount, risksCount, domainColor }`
- [ ] Dependency → edge com `data: { type, label }`, styled por tipo
- [ ] Positions calculadas server-side com dagre
- [ ] Filtros: `?domain=X`, `?dependencyType=HTTP_API,KAFKA_TOPIC`

---

#### Issue 4.2 — Componente React Flow com nodes e edges customizados

**Labels:** `epic:graph-ui`, `priority:high`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `DependencyGraph.tsx` (Client) + `DependencyGraph.module.css`
- [ ] `SystemNode.tsx` + `SystemNode.module.css` — nome, domain badge, linguagem, ícone risco
- [ ] `DependencyEdge.tsx` — cores por tipo (HTTP=azul, Kafka=verde, DB=laranja, Package=cinza)
- [ ] Layout dagre nos initial nodes. MiniMap, Controls, Background.
- [ ] `src/app/(dashboard)/graph/page.tsx` — Server Component que busca e passa dados

---

#### Issue 4.3 — Painel lateral de detalhes

**Labels:** `epic:graph-ui`, `priority:medium`, `copilot-agent`

**Acceptance Criteria:**
- [ ] Click no nó → Sheet (shadcn) lateral
- [ ] Busca detalhes via Server Action
- [ ] Tabs: Serviços, Bancos, Integrações, Kafka, Pacotes, Riscos
- [ ] Badges de severidade, link para repo, botão "highlight dependencies"
- [ ] `SystemDetail.module.css`

---

#### Issue 4.4 — Toolbar de filtros e legendas

**Labels:** `epic:graph-ui`, `priority:medium`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `GraphToolbar.tsx` + `GraphToolbar.module.css`
- [ ] Filtros: domínio (multi-select), tipo dependência (checkboxes coloridos), linguagem, search
- [ ] Toggle sistemas isolados. Legenda cores. Contador.
- [ ] Filtros sincronizados com query params (URL shareable)

---

### Epic 5 — Dashboard & Overview

---

#### Issue 5.1 — Dashboard com métricas

**Labels:** `epic:dashboard`, `priority:medium`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `src/app/(dashboard)/dashboard/page.tsx` — Server Component
- [ ] Cards: domínios, sistemas, dependências, riscos HIGH+CRITICAL
- [ ] Distribuição linguagens, dependências por tipo (charts simples ou Recharts)
- [ ] Top 5 sistemas mais conectados. Riscos recentes. Uploads recentes.
- [ ] Link para grafo. `Dashboard.module.css`

---

#### Issue 5.2 — Listagem de sistemas

**Labels:** `epic:dashboard`, `priority:low`, `copilot-agent`

**Acceptance Criteria:**
- [ ] Tabela server-rendered com busca e filtro por domínio
- [ ] Click → `/systems/[slug]` com page de detalhe
- [ ] Sorting client-side

---

### Epic 6 — Qualidade & Documentação

---

#### Issue 6.1 — CI pipeline

**Labels:** `epic:qualidade`, `priority:medium`, `copilot-agent`

**Acceptance Criteria:**
- [ ] `.github/workflows/ci.yml`: typecheck → lint → test → build (Node 20)
- [ ] Prisma generate antes de typecheck. Coverage thresholds.
- [ ] Status checks required para merge.

---

#### Issue 6.2 — Documentação

**Labels:** `epic:qualidade`, `priority:low`, `copilot-agent`

**Acceptance Criteria:**
- [ ] README: visão geral, stack, setup local, screenshots
- [ ] `CONTRIBUTING.md`: convenções, estrutura, como adicionar resolver
- [ ] `docs/json-schema.md`: schema entrada documentado
- [ ] `docs/architecture.md`: diagrama Mermaid do fluxo

---

## 3. Sequência de Execução

```
Epic 1 (Bootstrap) — sequential
  1.1 → 1.2 → 1.3 → 1.4 → 1.5

Epic 2 (Ingestão) — depende de Epic 1
  2.1 → 2.2 → 2.3 + 2.4 (paralelo)

Epic 3 (Graph Engine) — depende de 2.2
  3.1 + 3.2 + 3.3 (paralelo) → 3.4

Epic 4 (Visualização) — depende de 3.4
  4.1 → 4.2 → 4.3 + 4.4 (paralelo)

Epic 5 (Dashboard) — depende de 2.4 e 4.1
  5.1 → 5.2

Epic 6 (Qualidade) — CI em paralelo desde Epic 1, docs ao final
  6.1 (junto com 1.5) → 6.2 (ao final)
```

---

## 4. Labels do GitHub

| Label               | Cor       | Descrição                           |
| ------------------- | --------- | ----------------------------------- |
| `epic:bootstrap`    | `#0E8A16` | Setup e infraestrutura              |
| `epic:ingestao`     | `#1D76DB` | Upload e parsing de inventários     |
| `epic:graph-engine` | `#D93F0B` | Motor de inferência de dependências |
| `epic:graph-ui`     | `#7057FF` | Visualização React Flow             |
| `epic:dashboard`    | `#FBCA04` | Dashboard e métricas                |
| `epic:qualidade`    | `#B60205` | Testes, CI, docs                    |
| `priority:high`     | `#D93F0B` | Prioridade alta                     |
| `priority:medium`   | `#FBCA04` | Prioridade média                    |
| `priority:low`      | `#0E8A16` | Prioridade baixa                    |
| `copilot-agent`     | `#5319E7` | Tarefa para Copilot Agent           |

---

## 5. Issue Template

Criar em `.github/ISSUE_TEMPLATE/copilot-agent-task.md`:

```markdown
---
name: Copilot Agent Task
about: Task for GitHub Copilot Agent Mode execution
title: "[AGENT] "
labels: copilot-agent
assignees: ''
---

> [!NOTE]
> **Copilot Agent Instructions — Domain Mapper**
> (Cole aqui o bloco completo da Seção 1)

## Descrição

<!-- Descreva a tarefa com contexto claro -->

## Acceptance Criteria

- [ ] Critério 1
- [ ] Critério 2

## Arquivos Relevantes

<!-- Arquivos a criar ou modificar -->

## Dependências

<!-- Issues que devem estar completas antes -->

## Notas Técnicas

<!-- Decisões de design, edge cases -->
```

---

## 6. JSON de Exemplo — Inventário Grifo

Arquivo `examples/grifo-inventory.json`:

```json
{
  "systems": [
    {
      "name": "Grifo",
      "slug": "grifo",
      "domain": "Tesouro Direto",
      "purpose": "Gestão de posições e ordens de Tesouro Direto com integração Sinacor",
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
        { "path": "/v1/bonds", "method": "GET", "description": "Buscar/popular bonds do Athena" },
        { "path": "/v1/customers/processings/enqueue", "method": "POST", "description": "Enfileirar processamento" },
        { "path": "/v1/positions", "method": "GET", "description": "Consultar posições" },
        { "path": "/v1/orders", "method": "GET", "description": "Consultar ordens" },
        { "path": "/v1/dates", "method": "GET", "description": "Calendário de negócios" },
        { "path": "/v1/data-checks", "method": "GET", "description": "Data checks por cliente" },
        { "path": "/v1/reports/ir", "method": "GET", "description": "Relatório de IR" },
        { "path": "/v1/backfill", "method": "POST", "description": "Trigger backfill de ordens" }
      ],
      "risks": [
        { "title": "Pomelo MySQL preview", "description": "9.0.0-preview.3 — dependência preview em produção", "severity": "HIGH" },
        { "title": "Oracle dependency", "description": "Acoplamento forte com infraestrutura legada Sinacor", "severity": "HIGH" },
        { "title": "Warren.Core version mismatch", "description": "3 versões no mesmo repo (4.1.0, 6.1.4, 7.0.3)", "severity": "MEDIUM" },
        { "title": "Cross-database queries", "description": "Raw SQL entre schemas Grifo e GrifoIntegration", "severity": "MEDIUM" },
        { "title": "Sem testes de integração", "description": "Apenas unit tests", "severity": "MEDIUM" },
        { "title": "FluentAssertions mismatch", "description": "7.0.0 vs 8.2.0 entre solutions", "severity": "LOW" },
        { "title": "RestSharp 106.x deprecated", "description": "Versão deprecated mas não utilizada", "severity": "LOW" }
      ]
    }
  ]
}
```
