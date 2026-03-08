-- CreateTable
CREATE TABLE "StatusPageConfig" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusPageConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusPageProduct" (
    "id" TEXT NOT NULL,
    "statusPageId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "publicName" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StatusPageProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusPageFeature" (
    "id" TEXT NOT NULL,
    "statusPageProductId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "publicName" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StatusPageFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StatusPageConfig_workspaceId_key" ON "StatusPageConfig"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "StatusPageConfig_slug_key" ON "StatusPageConfig"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "StatusPageProduct_statusPageId_productId_key" ON "StatusPageProduct"("statusPageId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "StatusPageFeature_statusPageProductId_featureId_key" ON "StatusPageFeature"("statusPageProductId", "featureId");

-- AddForeignKey
ALTER TABLE "StatusPageConfig" ADD CONSTRAINT "StatusPageConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPageProduct" ADD CONSTRAINT "StatusPageProduct_statusPageId_fkey" FOREIGN KEY ("statusPageId") REFERENCES "StatusPageConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPageProduct" ADD CONSTRAINT "StatusPageProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPageFeature" ADD CONSTRAINT "StatusPageFeature_statusPageProductId_fkey" FOREIGN KEY ("statusPageProductId") REFERENCES "StatusPageProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPageFeature" ADD CONSTRAINT "StatusPageFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
