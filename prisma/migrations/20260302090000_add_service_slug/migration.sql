-- 1. Add slug column as nullable first
ALTER TABLE "Service" ADD COLUMN "slug" TEXT;

-- 2. Populate existing rows: use lowercased name as slug
UPDATE "Service" SET "slug" = LOWER(REPLACE("name", ' ', '-'));

-- 3. Make slug NOT NULL
ALTER TABLE "Service" ALTER COLUMN "slug" SET NOT NULL;

-- 4. Add unique index
CREATE UNIQUE INDEX "Service_slug_key" ON "Service" ("slug");