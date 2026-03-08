-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('DEGRADED', 'OUTAGE');

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "affectedProductId" TEXT NOT NULL,
    "affectedFeatureId" TEXT,
    "publicName" TEXT NOT NULL,
    "status" "IncidentStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "auto" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Incident_workspaceId_startedAt_idx" ON "Incident"("workspaceId", "startedAt");

-- CreateIndex
CREATE INDEX "Incident_workspaceId_resolvedAt_idx" ON "Incident"("workspaceId", "resolvedAt");

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_affectedProductId_fkey" FOREIGN KEY ("affectedProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_affectedFeatureId_fkey" FOREIGN KEY ("affectedFeatureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
