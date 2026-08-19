-- Journal de caisse (encaissements et décaissements)

CREATE TABLE "journal_caisse" (
    "id" BIGSERIAL NOT NULL,
    "sens" VARCHAR(20) NOT NULL,
    "montant" DECIMAL(12,2) NOT NULL,
    "mode_paiement" VARCHAR(20),
    "libelle" VARCHAR(500) NOT NULL,
    "patient_id" BIGINT,
    "reference_type" VARCHAR(50),
    "reference_id" BIGINT,
    "encaissement_id" BIGINT,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_caisse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "journal_caisse_encaissement_id_key" ON "journal_caisse"("encaissement_id");
CREATE INDEX "journal_caisse_created_at_idx" ON "journal_caisse"("created_at");
CREATE INDEX "journal_caisse_sens_idx" ON "journal_caisse"("sens");
CREATE INDEX "journal_caisse_patient_id_idx" ON "journal_caisse"("patient_id");

ALTER TABLE "journal_caisse" ADD CONSTRAINT "journal_caisse_encaissement_id_fkey" FOREIGN KEY ("encaissement_id") REFERENCES "encaissements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "journal_caisse" ADD CONSTRAINT "journal_caisse_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
