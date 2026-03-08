-- CreateEnum
CREATE TYPE "OverrideStatus" AS ENUM ('INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED');

-- CreateTable
CREATE TABLE "StatusOverride" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" "OverrideStatus" NOT NULL,
    "message" TEXT,
    "setBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StatusOverride_workspaceId_targetType_targetId_idx" ON "StatusOverride"("workspaceId", "targetType", "targetId");

-- AddForeignKey
ALTER TABLE "StatusOverride" ADD CONSTRAINT "StatusOverride_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusOverride" ADD CONSTRAINT "StatusOverride_setBy_fkey" FOREIGN KEY ("setBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
