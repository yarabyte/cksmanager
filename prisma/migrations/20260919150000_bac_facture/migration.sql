-- CreateTable
CREATE TABLE "facture_prescriptions" (
    "facture_id" BIGINT NOT NULL,
    "prescription_id" BIGINT NOT NULL,

    CONSTRAINT "facture_prescriptions_pkey" PRIMARY KEY ("facture_id","prescription_id")
);

-- CreateTable
CREATE TABLE "bac_factures" (
    "id" BIGSERIAL NOT NULL,
    "facture_id" BIGINT NOT NULL,
    "encaissement_id" BIGINT,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "printed_at" TIMESTAMP(3),
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bac_factures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facture_prescriptions_prescription_id_key" ON "facture_prescriptions"("prescription_id");

-- CreateIndex
CREATE UNIQUE INDEX "bac_factures_encaissement_id_key" ON "bac_factures"("encaissement_id");

-- CreateIndex
CREATE INDEX "bac_factures_statut_idx" ON "bac_factures"("statut");

-- CreateIndex
CREATE INDEX "bac_factures_facture_id_idx" ON "bac_factures"("facture_id");

-- CreateIndex
CREATE INDEX "bac_factures_created_at_idx" ON "bac_factures"("created_at");

-- AddForeignKey
ALTER TABLE "facture_prescriptions" ADD CONSTRAINT "facture_prescriptions_facture_id_fkey" FOREIGN KEY ("facture_id") REFERENCES "factures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facture_prescriptions" ADD CONSTRAINT "facture_prescriptions_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bac_factures" ADD CONSTRAINT "bac_factures_facture_id_fkey" FOREIGN KEY ("facture_id") REFERENCES "factures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bac_factures" ADD CONSTRAINT "bac_factures_encaissement_id_fkey" FOREIGN KEY ("encaissement_id") REFERENCES "encaissements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bac_factures" ADD CONSTRAINT "bac_factures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
