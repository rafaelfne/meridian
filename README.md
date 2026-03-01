# Meridian — Tech Radar

**Meridian** is a web application that visualizes inter-system dependencies across your organization. Teams upload JSON inventories describing their systems — services, databases, integrations, message topics, packages, and risks — and the tool automatically resolves and renders a dependency graph so you can spot coupling, shared databases, and architectural risks at a glance.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.17-2D3748)
![License](https://img.shields.io/badge/license-MIT-green)

## Key Features

- **Inventory ingestion** — drag-and-drop JSON upload validated with Zod schemas
- **Automatic dependency resolution** — HTTP, Kafka, RabbitMQ, SQS, shared-database, shared-package, gRPC, and file resolvers
- **Interactive graph** — React Flow canvas with dagre layout, custom nodes/edges, filters, and export
- **Domain isolation** — systems grouped by business domains with colour-coded nodes
- **Auth** — GitHub OAuth and credentials login via Auth.js v5

## Tech Stack

| Layer          | Technology                                           |
| -------------- | ---------------------------------------------------- |
| Framework      | Next.js 16 (App Router, Turbopack, React 19)         |
| Graph          | React Flow (`@xyflow/react`) + dagre layout          |
| ORM / Database | Prisma 6.17 · PostgreSQL                             |
| Validation     | Zod 4                                                |
| Auth           | Auth.js v5 (`next-auth@beta`) — Credentials + GitHub |
| Styling        | Tailwind CSS 4 + CSS Modules + shadcn/ui             |
| Testing        | Vitest + React Testing Library + MSW                 |
| Linting        | ESLint 9 + Prettier                                  |

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Docker](https://www.docker.com/) & Docker Compose

## Quick Start

```bash
# 1. Install dependencies and configure environment
pnpm install && cp .env.example .env

# 2. Start PostgreSQL and run migrations
pnpm db:up && npx prisma migrate dev

# 3. Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Available Scripts

| Script               | Description                                        |
| -------------------- | -------------------------------------------------- |
| `pnpm dev`           | Start the development server (Turbopack)           |
| `pnpm build`         | Production build                                   |
| `pnpm start`         | Start the production server                        |
| `pnpm lint`          | Run ESLint                                         |
| `pnpm typecheck`     | Run TypeScript type checking                       |
| `pnpm test`          | Run tests with Vitest                              |
| `pnpm test:watch`    | Run tests in watch mode                            |
| `pnpm test:coverage` | Run tests with coverage report                     |
| `pnpm db:up`         | Start PostgreSQL container in the background       |
| `pnpm db:down`       | Stop PostgreSQL container                          |
| `pnpm db:reset`      | Drop volume, restart container, and reset database |
| `pnpm db:migrate`    | Run Prisma migrations                              |
| `pnpm db:seed`       | Seed the database                                  |
| `pnpm db:studio`     | Open Prisma Studio                                 |

## Environment Variables

Copy `.env.example` to `.env` and adjust values as needed:

| Variable             | Description              | Default                |
| -------------------- | ------------------------ | ---------------------- |
| `POSTGRES_USER`      | PostgreSQL user          | `user`                 |
| `POSTGRES_PASSWORD`  | PostgreSQL password      | `password`             |
| `POSTGRES_DB`        | PostgreSQL database name | `domain_mapper`        |
| `POSTGRES_PORT`      | PostgreSQL host port     | `5432`                 |
| `DATABASE_URL`       | Prisma connection string | matches Compose values |
| `AUTH_SECRET`        | Auth.js secret           | —                      |
| `AUTH_GITHUB_ID`     | GitHub OAuth App ID      | —                      |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Secret  | —                      |

## Project Structure

```
src/
├── app/            # Next.js App Router (routes, layouts, API handlers)
├── modules/        # Domain modules (business logic, actions, validators)
│   ├── inventory/  #   Inventory ingestion & processing
│   ├── graph/      #   Dependency resolution & graph building
│   ├── system/     #   System CRUD
│   ├── dashboard/  #   Dashboard metrics
│   └── auth/       #   Authentication logic
├── components/     # React components (ui, graph, inventory, shared)
├── lib/            # Infrastructure glue (prisma, auth, utils)
└── types/          # Shared TypeScript types
```

See [docs/architecture.md](docs/architecture.md) for a detailed architecture diagram.

## Documentation

| Document                                     | Description                              |
| -------------------------------------------- | ---------------------------------------- |
| [docs/architecture.md](docs/architecture.md) | Architecture overview & Mermaid diagrams |
| [docs/json-schema.md](docs/json-schema.md)   | Inventory JSON input schema reference    |
| [CONTRIBUTING.md](CONTRIBUTING.md)           | Contribution guidelines                  |

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Flow Documentation](https://reactflow.dev)
