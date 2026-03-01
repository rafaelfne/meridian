# Contributing to Meridian

Thank you for your interest in contributing! This guide covers conventions, project structure, and how to extend the codebase.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Docker](https://www.docker.com/) & Docker Compose

## Getting Started

```bash
# Clone and install
git clone https://github.com/rafaelfne/tech-radar.git
cd tech-radar
pnpm install && cp .env.example .env

# Start the database and run migrations
pnpm db:up && npx prisma migrate dev

# Start the dev server
pnpm dev
```

## Project Structure

```
src/
├── app/                        # Next.js App Router — thin route layer
│   ├── (auth)/                 # Public routes: login, register
│   ├── (dashboard)/            # Protected routes: dashboard, upload, graph, systems
│   └── api/                    # Route Handlers (REST endpoints)
│
├── modules/                    # Domain modules — isolated business logic
│   ├── inventory/
│   │   ├── actions/            # Server Actions (mutations)
│   │   ├── services/           # Pure business logic
│   │   └── validators/         # Zod schemas
│   ├── graph/
│   │   ├── services/           # Dependency resolvers + graph builder
│   │   └── validators/         # Graph query schemas
│   ├── system/
│   ├── dashboard/
│   └── auth/
│
├── components/                 # UI components
│   ├── ui/                     # shadcn/ui base components
│   ├── graph/                  # React Flow (DependencyGraph, SystemNode, …)
│   ├── inventory/              # Upload components
│   └── shared/                 # Cross-cutting (Header, SessionProvider)
│
├── lib/                        # Infrastructure glue
│   ├── prisma.ts               # Prisma client singleton
│   ├── auth.ts                 # Auth.js v5 full config
│   ├── auth.config.ts          # Edge-compatible auth config
│   └── utils.ts                # Utility helpers (cn, etc.)
│
└── types/                      # Shared global types
```

## Coding Conventions

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add gRPC dependency resolver
fix: handle missing slug in HTTP resolver
test: add unit tests for messaging resolver
docs: update architecture diagram
chore: bump Prisma to 6.17
```

### Branches

```
feat/issue-42-grpc-resolver
fix/issue-55-missing-slug
```

### TypeScript

- Strict mode is enabled (`strict: true`, `noUncheckedIndexedAccess: true`).
- Validate all external input with Zod schemas.
- Use path aliases (`@/modules/…`, `@/lib/…`, `@/components/…`).

### Styling

- Use **CSS Modules** (`.module.css`) for component-specific styles.
- Use **Tailwind CSS** only for layout utilities (flex, grid, padding, margin).
- Use `clsx` for conditional class composition.
- Never use inline styles except for truly dynamic values (e.g., computed positions).

### Server Components vs Client Components

- Default to **Server Components**.
- Only add `"use client"` when the component needs interactivity, browser APIs, or hooks.
- Use Server Actions for all data mutations (create, update, delete).

### Domain Isolation

Business logic lives in `src/modules/<domain>/services/` as **pure functions** that receive dependencies via parameters (no direct Prisma imports):

```typescript
// ✅ Correct — dependency injection
export async function resolveHttpDependencies(
  getAllIntegrations: () => Promise<Integration[]>,
  getSystemBySlug: (slug: string) => Promise<System | null>,
): Promise<ResolvedDependency[]> { /* … */ }

// ❌ Wrong — direct import
import { prisma } from "@/lib/prisma";
export async function resolveHttpDependencies() {
  const integrations = await prisma.integration.findMany();
  // …
}
```

Wiring happens in **Server Actions** or **Route Handlers** (the composition root).

## Testing

- Test files are co-located: `service.ts` → `service.test.ts`.
- Use **Vitest** + **React Testing Library** + **MSW** for API mocking.
- Run tests: `pnpm test` · Watch mode: `pnpm test:watch` · Coverage: `pnpm test:coverage`.

## How to Add a Dependency Resolver

The graph module resolves system dependencies by type. Each resolver is a standalone pure function in `src/modules/graph/services/`. Follow these steps to add a new one:

### 1. Define the dependency interface

Create `src/modules/graph/services/resolve-<type>-deps.ts`:

```typescript
export interface Resolve<Type>DepsDeps {
  // Declare the data-access functions your resolver needs
  getAllItems: () => Promise<ItemRecord[]>;
  getSystemBySlug: (slug: string) => Promise<{ id: string } | null>;
}

export interface DependencyResult {
  sourceId: string;
  targetId: string;
  type: string;       // e.g., "GRPC"
  label?: string;
}
```

### 2. Implement the resolver

```typescript
export async function resolveNewTypeDeps(
  deps: ResolveNewTypeDepsDeps,
): Promise<DependencyResult[]> {
  const items = await deps.getAllItems();
  const results: DependencyResult[] = [];

  for (const item of items) {
    const target = await deps.getSystemBySlug(item.targetSlug);
    if (!target) continue;

    results.push({
      sourceId: item.systemId,
      targetId: target.id,
      type: "NEW_TYPE",
      label: item.description,
    });
  }

  return results;
}
```

### 3. Register the resolver

Wire the new resolver into the dependency processing action (e.g., `src/modules/graph/actions/` or `src/app/api/dependencies/process/route.ts`) by passing Prisma queries as dependencies:

```typescript
import { resolveNewTypeDeps } from "../services/resolve-new-type-deps";

const newDeps = await resolveNewTypeDeps({
  getAllItems: () => prisma.newItem.findMany({ include: { system: true } }),
  getSystemBySlug: (slug) => prisma.system.findUnique({ where: { slug } }),
});
```

### 4. Add the dependency type

If the type is new, add it to the `DependencyType` enum in `prisma/schema.prisma` and run:

```bash
npx prisma migrate dev --name add_new_type_dependency
```

Also update the `VALID_DEPENDENCY_TYPES` array in `src/modules/graph/validators/graph-query-schema.ts`.

### 5. Write tests

Create `resolve-<type>-deps.test.ts` next to your resolver. Mock the dependency interface:

```typescript
import { describe, it, expect, vi } from "vitest";
import { resolveNewTypeDeps } from "./resolve-new-type-deps";

describe("resolveNewTypeDeps", () => {
  it("resolves dependencies when target system exists", async () => {
    const deps = {
      getAllItems: vi.fn().mockResolvedValue([
        { systemId: "src-1", targetSlug: "target-sys", description: "Test" },
      ]),
      getSystemBySlug: vi.fn().mockResolvedValue({ id: "tgt-1" }),
    };

    const result = await resolveNewTypeDeps(deps);

    expect(result).toEqual([
      { sourceId: "src-1", targetId: "tgt-1", type: "NEW_TYPE", label: "Test" },
    ]);
  });

  it("skips dependencies when target system is not found", async () => {
    const deps = {
      getAllItems: vi.fn().mockResolvedValue([
        { systemId: "src-1", targetSlug: "missing", description: "Gone" },
      ]),
      getSystemBySlug: vi.fn().mockResolvedValue(null),
    };

    const result = await resolveNewTypeDeps(deps);

    expect(result).toEqual([]);
  });
});
```

### 6. Verify

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

## CI Pipeline

The CI pipeline runs: **typecheck → lint → test → build**. All four steps must pass before merging.

## Questions?

Open an issue or start a discussion on the repository.
