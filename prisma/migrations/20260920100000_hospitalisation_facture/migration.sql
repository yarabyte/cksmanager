-- AlterTable
ALTER TABLE "hospitalisations" ADD COLUMN IF NOT EXISTS "facture_id" BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "hospitalisations_facture_id_key" ON "hospitalisations"("facture_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "hospitalisations" ADD CONSTRAINT "hospitalisations_facture_id_fkey" FOREIGN KEY ("facture_id") REFERENCES "factures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
