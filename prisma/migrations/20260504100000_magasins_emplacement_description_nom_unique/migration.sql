-- AlterTable (structure référence magasin.sql)
ALTER TABLE "magasins" ADD COLUMN IF NOT EXISTS "emplacement" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Unique sur le nom (équivalent MySQL magasins_nom_unique)
CREATE UNIQUE INDEX IF NOT EXISTS "magasins_nom_key" ON "magasins"("nom");
