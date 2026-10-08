-- AlterTable
ALTER TABLE "actes" ADD COLUMN IF NOT EXISTS "exonere_part_patient" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "feuille_circulation_lignes" ADD COLUMN IF NOT EXISTS "exonere_part_patient" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "avoirs_feuilles_circulation" ADD COLUMN IF NOT EXISTS "nature" VARCHAR(20) NOT NULL DEFAULT 'SOLDE';

-- DropIndex
ALTER TABLE "avoirs_feuilles_circulation" DROP CONSTRAINT IF EXISTS "avoirs_feuilles_circulation_feuille_id_key";
DROP INDEX IF EXISTS "avoirs_feuilles_circulation_feuille_id_key";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "avoirs_feuilles_circulation_feuille_id_nature_key" ON "avoirs_feuilles_circulation"("feuille_id", "nature");
