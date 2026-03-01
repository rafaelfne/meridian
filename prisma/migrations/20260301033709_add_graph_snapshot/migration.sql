-- CreateEnum
CREATE TYPE "SystemLayer" AS ENUM ('EDGE', 'BUSINESS_LOGIC', 'DATA_INFRA');

-- AlterTable
ALTER TABLE "System" ADD COLUMN     "layer" "SystemLayer";

-- CreateTable
CREATE TABLE "GraphSnapshot" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "nodesJson" JSONB NOT NULL,
    "edgesJson" JSONB NOT NULL,
    "systemCount" INTEGER NOT NULL,
    "edgeCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GraphSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GraphSnapshot_uploadId_key" ON "GraphSnapshot"("uploadId");

-- AddForeignKey
ALTER TABLE "GraphSnapshot" ADD CONSTRAINT "GraphSnapshot_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "InventoryUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
