
import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  seed: {
    command: `npx tsx ${path.join("prisma", "seed.ts")}`,
  },
  engine: "classic",
  datasource: {
    url: process.env["DATABASE_URL"] ?? "",
  },
});
