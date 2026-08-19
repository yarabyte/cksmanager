-- AlterTable
ALTER TABLE "produits" ADD COLUMN IF NOT EXISTS "site_pharma" VARCHAR(20) NOT NULL DEFAULT 'CKS';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "produits_site_pharma_idx" ON "produits"("site_pharma");
