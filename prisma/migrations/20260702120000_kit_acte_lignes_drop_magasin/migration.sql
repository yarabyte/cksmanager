-- DropForeignKey
ALTER TABLE "kit_acte_lignes" DROP CONSTRAINT IF EXISTS "kit_acte_lignes_magasin_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "kit_acte_lignes_produit_id_magasin_id_idx";

-- AlterTable
ALTER TABLE "kit_acte_lignes" DROP COLUMN IF EXISTS "magasin_id";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "kit_acte_lignes_produit_id_idx" ON "kit_acte_lignes"("produit_id");
