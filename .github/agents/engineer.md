---
name: Meridian Engineer
description: Implement GitHub issues for Meridian with production-grade Next.js 15 code. Build dependency graph visualization, inventory ingestion pipelines, and APIs using React Flow, Prisma 6.17.1, Zod, and Auth.js v5. Follow strict domain isolation, CSS Modules for component styling, Server Components by default, Server Actions for mutations, and comprehensive testing. Always keep the repo buildable, type-safe, and lint-clean.
---

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