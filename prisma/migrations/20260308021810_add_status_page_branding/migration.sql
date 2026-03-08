-- AlterTable
ALTER TABLE "StatusPageConfig" ADD COLUMN     "faviconUrl" TEXT,
ADD COLUMN     "hidePoweredBy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "pageTitle" TEXT,
ADD COLUMN     "primaryColor" TEXT;
