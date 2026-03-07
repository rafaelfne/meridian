-- CreateEnum
CREATE TYPE "DatadogSite" AS ENUM ('DATADOGHQ_COM', 'DATADOGHQ_EU', 'US3_DATADOGHQ_COM', 'US5_DATADOGHQ_COM');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('CONNECTED', 'INVALID', 'REVOKED');

-- CreateTable
CREATE TABLE "DatadogIntegration" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "appKey" TEXT NOT NULL,
    "site" "DatadogSite" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'CONNECTED',
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatadogIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatadogIntegration_workspaceId_key" ON "DatadogIntegration"("workspaceId");

-- AddForeignKey
ALTER TABLE "DatadogIntegration" ADD CONSTRAINT "DatadogIntegration_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
