-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_userId_workspaceId_key" ON "WorkspaceMember"("userId", "workspaceId");

-- Create a default workspace for existing data
INSERT INTO "Workspace" ("id", "name", "slug", "description", "createdAt", "updatedAt")
VALUES ('default-workspace-id', 'Default Workspace', 'default', 'Default workspace for migrated data', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add workspaceId to Domain (initially nullable, then backfill and make required)
ALTER TABLE "Domain" ADD COLUMN "workspaceId" TEXT;
UPDATE "Domain" SET "workspaceId" = 'default-workspace-id' WHERE "workspaceId" IS NULL;
ALTER TABLE "Domain" ALTER COLUMN "workspaceId" SET NOT NULL;

-- Drop existing unique index on Domain.name and add composite unique
DROP INDEX IF EXISTS "Domain_name_key";
CREATE UNIQUE INDEX "Domain_workspaceId_name_key" ON "Domain"("workspaceId", "name");

-- Add workspaceId to InventoryUpload (initially nullable, then backfill and make required)
ALTER TABLE "InventoryUpload" ADD COLUMN "workspaceId" TEXT;
UPDATE "InventoryUpload" SET "workspaceId" = 'default-workspace-id' WHERE "workspaceId" IS NULL;
ALTER TABLE "InventoryUpload" ALTER COLUMN "workspaceId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryUpload" ADD CONSTRAINT "InventoryUpload_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Assign all existing users as OWNER of the default workspace
INSERT INTO "WorkspaceMember" ("id", "userId", "workspaceId", "role", "createdAt", "updatedAt")
SELECT
    concat('cm', substr(md5(random()::text || "id"), 1, 23)),
    "id",
    'default-workspace-id',
    'OWNER'::"WorkspaceRole",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User";
