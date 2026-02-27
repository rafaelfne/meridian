# Domain Mapper — Tech Radar

Dependency graph visualization for software systems, built with Next.js 15, React Flow, and Prisma.

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

## Database Scripts

| Script         | Description                                      |
| -------------- | ------------------------------------------------ |
| `pnpm db:up`   | Start PostgreSQL container in the background      |
| `pnpm db:down` | Stop PostgreSQL container                         |
| `pnpm db:reset`| Drop volume, restart container, and reset database|

## Environment Variables

Copy `.env.example` to `.env` and adjust values as needed:

| Variable            | Description                          | Default                |
| ------------------- | ------------------------------------ | ---------------------- |
| `POSTGRES_USER`     | PostgreSQL user                      | `user`                 |
| `POSTGRES_PASSWORD` | PostgreSQL password                  | `password`             |
| `POSTGRES_DB`       | PostgreSQL database name             | `domain_mapper`        |
| `POSTGRES_PORT`     | PostgreSQL host port                 | `5432`                 |
| `DATABASE_URL`      | Prisma connection string             | matches Compose values |
| `AUTH_SECRET`       | Auth.js secret                       | —                      |
| `AUTH_GITHUB_ID`    | GitHub OAuth App ID                  | —                      |
| `AUTH_GITHUB_SECRET`| GitHub OAuth App Secret              | —                      |

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Flow Documentation](https://reactflow.dev)
