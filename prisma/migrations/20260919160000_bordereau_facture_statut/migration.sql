-- AlterTable
ALTER TABLE "bordereau_factures" ADD COLUMN IF NOT EXISTS "statut" VARCHAR(20) NOT NULL DEFAULT 'EN_BORDEREAU';
ALTER TABLE "bordereau_factures" ADD COLUMN IF NOT EXISTS "date_depot" DATE;
ALTER TABLE "bordereau_factures" ADD COLUMN IF NOT EXISTS "note_depot" TEXT;
ALTER TABLE "bordereau_factures" ADD COLUMN IF NOT EXISTS "date_paiement" DATE;
ALTER TABLE "bordereau_factures" ADD COLUMN IF NOT EXISTS "ref_virement" VARCHAR(100);

-- Backfill depuis le statut du bordereau parent
UPDATE "bordereau_factures" bf
SET
  "statut" = CASE b."statut"
    WHEN 'PAYE' THEN 'PAYE'
    WHEN 'DEPOSE' THEN 'DEPOSE'
    ELSE 'EN_BORDEREAU'
  END,
  "date_depot" = b."date_depot",
  "note_depot" = b."note_depot",
  "date_paiement" = b."date_paiement",
  "ref_virement" = b."ref_virement"
FROM "bordereaux_assureurs" b
WHERE bf."bordereau_id" = b."id";

CREATE INDEX IF NOT EXISTS "bordereau_factures_statut_idx" ON "bordereau_factures"("statut");
