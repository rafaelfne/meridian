# Meridian

**Meridian** is a platform for system dependency mapping and public status page management. It allows engineering teams to upload system inventories, automatically resolve dependencies between services, and expose real-time operational health through customizable, white-labeled public status pages.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.17-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Table of Contents

- [Product Overview](#product-overview)
  - [What Meridian Delivers](#what-meridian-delivers)
  - [Core Capabilities](#core-capabilities)
  - [Business Rules](#business-rules)
- [Technical Documentation](#technical-documentation)
  - [Tech Stack](#tech-stack)
  - [Architecture](#architecture)
  - [Project Structure](#project-structure)
  - [Data Model](#data-model)
  - [API Routes](#api-routes)
  - [Getting Started](#getting-started)
  - [Environment Variables](#environment-variables)
  - [Available Scripts](#available-scripts)
  - [Testing](#testing)
- [Documentation](#documentation)

---

## Product Overview

### What Meridian Delivers

Meridian solves two key problems for engineering organizations:

1. **Visibility into system dependencies** — Teams upload JSON inventories describing their systems (services, databases, integrations, message topics, packages, and risks). Meridian automatically resolves and renders an interactive dependency graph, exposing coupling, shared databases, and architectural risks at a glance.

2. **Public operational status pages** — Meridian generates fully customizable, white-labeled status pages that reflect real-time system health. Health data flows from Datadog monitors through products and features, giving end-users a clear view of service availability with zero manual updates.

### Core Capabilities

#### System Inventory & Dependency Graph

- **Inventory ingestion** — Drag-and-drop JSON upload validated with Zod schemas. Each inventory describes a system's services, databases, integrations, message topics, packages, API endpoints, and known risks.
- **Automatic dependency resolution** — Resolvers for HTTP, Kafka, RabbitMQ, SQS, shared-database, cross-database queries, shared-package, gRPC, and file dependencies. Dependencies are inferred by matching producers to consumers, integration targets to system names, and shared resources across inventories.
- **Interactive graph** — React Flow canvas with dagre auto-layout, domain-colored nodes, labeled edges, filters by domain/service type/dependency type, and PNG/JSON export.
- **Domain grouping** — Systems are organized into business domains with color-coded visualization.

#### Products & Features

- **Product hierarchy** — Services are organized into Products (e.g., "Checkout", "Payments"), each with a criticality tier (Critical, High, Medium, Low).
- **Feature breakdown** — Products contain Features (e.g., "Payment Processing", "Refunds") that map to specific systems.
- **System linking** — Both products and features can be linked to underlying systems, establishing the connection between business capabilities and technical infrastructure.

#### Public Status Page

- **Real-time health display** — A publicly accessible page (`/status/[slug]`) showing per-product and per-feature operational status with three states: Operational, Partial Outage, and Major Outage.
- **90-day uptime history** — Visual bar chart per product showing daily health status for the past 90 days.
- **Incident history** — Chronological list of past incidents grouped by month, covering the last 90 days.
- **Auto-refresh** — Status page refreshes every 60 seconds without manual intervention.
- **White-labeling** — Custom logo, favicon, primary color, page title, and the option to hide "Powered by Meridian" branding.

#### Incident Management

- **Declare incidents** — Manually create incidents targeting a specific product or feature, with a status (Investigating, Identified, Monitoring) and an optional public message.
- **Auto-expiry** — Incidents expire automatically after 24 hours if not resolved manually.
- **Incident timeline** — Active incidents display elapsed time; resolved incidents show total duration.
- **Update & resolve** — Incidents can be updated (change status/message) or resolved at any time.

#### Datadog Integration

- **Monitor polling** — A cron endpoint polls Datadog monitors and updates each system's health status (OK, Warn, Alert, No Data).
- **Encrypted credentials** — Datadog API and App keys are stored with field-level AES encryption.
- **Multi-site support** — Supports Datadog US1, EU1, US3, and US5 sites.

#### Workspace Management

- **Multi-tenant isolation** — All data is scoped to workspaces. Each workspace has its own systems, products, status page, and integrations.
- **Role-based access** — Three roles: Owner (full control), Editor (create/modify), Viewer (read-only).
- **Member management** — Invite users by email, assign roles, and manage membership.

#### System Documentation

- **Markdown documents** — Create and manage technical documentation per system using Markdoc.
- **Revision history** — Every edit creates a revision, preserving document history.
- **Draft & published states** — Documents can be drafted before being published.

---

### Business Rules

#### Health Calculation

Health status flows bottom-up through the hierarchy: **Systems -> Features -> Products -> Overall Status**.

| Level | Rule |
|---|---|
| **System** | Derived from Datadog monitor status. `OK` / `NO_DATA` = Operational. `WARN` = Partial Outage. `ALERT` = Major Outage. Systems without monitors default to Operational. |
| **Feature** | Worst health among all linked systems. If no systems are linked, defaults to Operational. |
| **Product** | Worst health among all features. If no features exist, defaults to Operational. |
| **Overall** | Worst health among all visible products. If no products exist, defaults to Operational. |

#### Status Overrides

Manual overrides (declared via incidents) take precedence over automated health when they result in a worse status:

| Override Status | Mapped Health |
|---|---|
| Investigating | Major Outage |
| Identified | Major Outage |
| Monitoring | Partial Outage |
| Resolved | No effect (override removed) |

The final health for any product or feature is: `worst(calculated_health, override_health)`. Overrides never improve health — they can only make it worse.

#### Incident Reconciliation

Meridian automatically reconciles incidents based on current health state:

| Current State | Action |
|---|---|
| No incident + health degraded | Auto-create incident |
| Existing incident + health worsened | Escalate (e.g., Degraded -> Outage) |
| Existing incident + health operational | Auto-resolve (record duration) |
| Orphaned incident (target removed) | Auto-resolve |

Resolved incidents older than 90 days are automatically cleaned up.

#### 90-Day Status History

For each product, Meridian computes daily health for the past 90 days by checking whether any incident (auto or manual) overlapped with each day. The worst incident status on a given day determines that day's health indicator.

#### Product Tiers

Products are classified by criticality tier, which communicates priority context:

| Tier | Meaning |
|---|---|
| Critical | Core functionality — outages have immediate business impact |
| High | Important functionality — outages affect significant user segments |
| Medium | Supporting functionality — outages are noticeable but not severe |
| Low | Non-essential functionality — outages have minimal impact |

#### Authentication & Authorization

- Users authenticate via GitHub OAuth or email/password credentials.
- All workspace resources require authentication. The only public route is the status page (`/status/[slug]`).
- Workspace roles enforce access: Owners can manage members and settings, Editors can modify systems and products, Viewers can only read.

---

## Technical Documentation

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, Server Actions) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Lucide icons |
| Graph | React Flow (`@xyflow/react`) + dagre layout engine |
| ORM / Database | Prisma 6.17, PostgreSQL |
| Validation | Zod 4 |
| Auth | Auth.js v5 (`next-auth@beta`) — Credentials + GitHub OAuth |
| Markdown | Markdoc + Shiki (syntax highlighting) |
| Monitoring | Datadog API Client |
| Testing | Vitest, React Testing Library, MSW, happy-dom |
| Linting | ESLint 9, Prettier |

### Architecture

Meridian is a Next.js monolith using the App Router with a clear separation between:

- **`app/`** — Route definitions, layouts, page components, and API route handlers.
- **`modules/`** — Domain business logic organized by bounded context (inventory, graph, product, status-page, etc.). Each module contains server actions, validators, and data access functions.
- **`components/`** — React components organized by feature area.
- **`lib/`** — Infrastructure utilities (Prisma client, auth config, encryption, workspace context).

**Data flow for status pages:**

```
Datadog Monitors
    |
    v
Cron Job (/api/cron/datadog-poll)
    |
    v
System.datadogStatus (updated in DB)
    |
    v
Feature health = worst(linked system statuses)
    |
    v
Product health = worst(feature statuses)
    |
    v
Incident reconciliation (auto-create/escalate/resolve)
    |
    v
Public Status Page (/status/[slug]) — auto-refreshes every 60s
    |
    + Manual Status Overrides (override health when worse)
```

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             #   Auth routes (login, signup)
│   ├── api/                #   API route handlers
│   │   ├── cron/           #     Scheduled jobs (Datadog polling)
│   │   └── w/[slug]/       #     Workspace-scoped API endpoints
│   ├── status/[slug]/      #   Public status page (no auth required)
│   └── w/[workspaceSlug]/  #   Workspace routes (protected)
│       ├── dashboard/      #     System metrics overview
│       ├── graph/          #     Dependency graph visualization
│       ├── systems/        #     System management & documentation
│       ├── products/       #     Product & feature management
│       ├── settings/       #     Workspace settings, status page config, incidents
│       └── upload/         #     JSON inventory upload
│
├── modules/                # Domain business logic
│   ├── auth/               #   Authentication
│   ├── dashboard/          #   Dashboard metrics & queries
│   ├── datadog/            #   Datadog integration logic
│   ├── docs/               #   Document management
│   ├── graph/              #   Dependency resolution & graph building
│   ├── inventory/          #   JSON inventory ingestion & validation
│   ├── product/            #   Product & feature CRUD
│   ├── status-page/        #   Status page config, health calculation, incident reconciliation
│   ├── system/             #   System CRUD
│   └── workspace/          #   Workspace & member management
│
├── components/             # React components by feature
│   ├── graph/              #   React Flow graph (canvas, nodes, edges)
│   ├── inventory/          #   Upload dropzone
│   ├── products/           #   Product & feature UI
│   ├── shared/             #   Common components
│   ├── status-page/        #   Public status page client
│   ├── systems/            #   System detail views
│   ├── ui/                 #   shadcn/ui primitives
│   ├── workspace/          #   Settings, incidents, status config
│   └── landing/            #   Landing page
│
├── lib/                    # Infrastructure
│   ├── auth.ts             #   Auth.js configuration
│   ├── prisma.ts           #   Prisma client singleton
│   ├── encryption.ts       #   AES field-level encryption
│   └── workspace-context.ts #  Workspace access control
│
└── types/                  # Shared TypeScript types

prisma/
├── schema.prisma           # Database schema
└── seed.ts                 # Database seeding

docs/
├── architecture.md         # Architecture diagrams (Mermaid)
└── json-schema.md          # Inventory JSON schema reference
```

### Data Model

The core entities and their relationships:

```
Workspace
├── Members (User + Role: Owner/Editor/Viewer)
├── Domains
│   └── Systems
│       ├── Services (API, Worker, CronJob, BackgroundService)
│       ├── Databases (provider, ORM, tables)
│       ├── Integrations (HTTP, gRPC, GraphQL, etc.)
│       ├── MessageTopics (Kafka, RabbitMQ, SQS — Producer/Consumer/Both)
│       ├── Packages (internal, open-source, test)
│       ├── ApiEndpoints
│       ├── Risks (severity: Low/Medium/High/Critical)
│       ├── Dependencies (resolved links to other systems)
│       └── Documents (Markdown, with revisions)
├── Products
│   ├── Features
│   │   └── FeatureSystems (linked systems)
│   └── ProductSystems (linked systems)
├── StatusPageConfig
│   ├── StatusPageProducts (visibility, display order, public name)
│   │   └── StatusPageFeatures (visibility, display order, public name)
├── Incidents (auto or manual, DEGRADED/OUTAGE)
├── StatusOverrides (manual health overrides with expiry)
├── DatadogIntegration (encrypted API/App keys)
├── InventoryUploads
└── GraphSnapshots
```

### API Routes

#### Public
| Method | Path | Description |
|---|---|---|
| GET | `/status/[slug]` | Public status page (SSR, no auth) |

#### Authentication
| Method | Path | Description |
|---|---|---|
| * | `/api/auth/[...nextauth]` | Auth.js endpoints (login, callback, session) |

#### Workspace-scoped (`/api/w/[workspaceSlug]/`)
| Method | Path | Description |
|---|---|---|
| GET, POST | `/systems` | List / create systems |
| GET, PUT, DELETE | `/systems/[slug]` | Get / update / delete a system |
| POST | `/systems/[slug]/docs/check-slug` | Verify document slug uniqueness |
| GET | `/graph` | Fetch graph data with filters |
| GET | `/graph/snapshots/[id]` | Retrieve saved graph snapshot |
| POST | `/dependencies/process` | Run dependency resolver |
| GET | `/domains` | List domains in workspace |
| POST | `/inventories/uploads` | Upload JSON inventory |
| GET, POST | `/members` | List / invite workspace members |
| GET | `/users/search` | Search users for invitations |
| POST | `/docs/preview` | Preview Markdown rendering |

#### Cron
| Method | Path | Description |
|---|---|---|
| GET | `/api/cron/datadog-poll` | Poll Datadog monitors (protected by `CRON_SECRET`) |

### Getting Started

#### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Docker](https://www.docker.com/) & Docker Compose

#### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/meridian.git
cd meridian

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# 4. Start PostgreSQL
pnpm db:up

# 5. Run database migrations
npx prisma migrate dev

# 6. (Optional) Seed the database
pnpm db:seed

# 7. Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Required | Default |
|---|---|---|---|
| `POSTGRES_USER` | PostgreSQL user | Yes | `user` |
| `POSTGRES_PASSWORD` | PostgreSQL password | Yes | `password` |
| `POSTGRES_DB` | PostgreSQL database name | Yes | `domain_mapper` |
| `POSTGRES_PORT` | PostgreSQL host port | Yes | `5432` |
| `DATABASE_URL` | Prisma connection string | Yes | Matches Compose values |
| `AUTH_SECRET` | Auth.js secret (random string) | Yes | — |
| `AUTH_GITHUB_ID` | GitHub OAuth App ID | For GitHub login | — |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Secret | For GitHub login | — |
| `NEXTAUTH_URL` | Application base URL | Yes | `http://localhost:3000` |
| `ENCRYPTION_KEY` | 32-byte base64 key for field encryption | For Datadog integration | — |
| `CRON_SECRET` | Secret for protecting cron endpoints | For Datadog polling | — |

Generate the encryption key with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start development server (Turbopack) |
| `pnpm build` | Production build (generates Prisma client + Next.js build) |
| `pnpm start` | Start production server (runs pending migrations + Next.js) |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run tests with Vitest |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm db:up` | Start PostgreSQL container |
| `pnpm db:down` | Stop PostgreSQL container |
| `pnpm db:reset` | Drop volume, restart container, reset database |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed the database |
| `pnpm db:studio` | Open Prisma Studio (database GUI) |

### Testing

Meridian uses **Vitest** with **React Testing Library** and **MSW** for API mocking.

```bash
# Run all tests
pnpm test

# Run tests in watch mode during development
pnpm test:watch

# Run with coverage report
pnpm test:coverage
```

---

## Documentation

| Document | Description |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Architecture overview with Mermaid diagrams |
| [docs/json-schema.md](docs/json-schema.md) | Inventory JSON input schema reference |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
