-- CreateTable
CREATE TABLE "hospitalisations" (
    "id" BIGSERIAL NOT NULL,
    "visite_id" BIGINT NOT NULL,
    "patient_id" BIGINT NOT NULL,
    "date_entree" DATE NOT NULL,
    "date_sortie" DATE,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'EN_COURS',
    "commentaires" TEXT,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "hospitalisations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hospitalisations_visite_id_key" ON "hospitalisations"("visite_id");

-- CreateIndex
CREATE INDEX "hospitalisations_patient_id_idx" ON "hospitalisations"("patient_id");

-- CreateIndex
CREATE INDEX "hospitalisations_statut_idx" ON "hospitalisations"("statut");

-- CreateIndex
CREATE INDEX "hospitalisations_date_sortie_idx" ON "hospitalisations"("date_sortie");

-- AddForeignKey
ALTER TABLE "hospitalisations" ADD CONSTRAINT "hospitalisations_visite_id_fkey" FOREIGN KEY ("visite_id") REFERENCES "visites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitalisations" ADD CONSTRAINT "hospitalisations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
