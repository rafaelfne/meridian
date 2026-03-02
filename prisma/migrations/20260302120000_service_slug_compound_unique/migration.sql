-- DropIndex
DROP INDEX IF EXISTS "Service_slug_key";

-- CreateIndex (compound unique: one slug per system)
CREATE UNIQUE INDEX "Service_systemId_slug_key" ON "Service" ("systemId", "slug");