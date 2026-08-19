-- CreateTable
CREATE TABLE "motifs" (
    "id" BIGSERIAL NOT NULL,
    "libelle" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "motifs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visites" (
    "id" BIGSERIAL NOT NULL,
    "patient_id" BIGINT NOT NULL,
    "motif_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "medecin_id" BIGINT NOT NULL,
    "date_visite" TIMESTAMP(3) NOT NULL,
    "commentaires" TEXT,
    "statut" VARCHAR(30) NOT NULL DEFAULT 'TERMINEE',
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "visites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visites_patient_id_idx" ON "visites"("patient_id");

-- CreateIndex
CREATE INDEX "visites_motif_id_idx" ON "visites"("motif_id");

-- CreateIndex
CREATE INDEX "visites_user_id_idx" ON "visites"("user_id");

-- CreateIndex
CREATE INDEX "visites_medecin_id_idx" ON "visites"("medecin_id");

-- CreateIndex
CREATE INDEX "visites_date_visite_idx" ON "visites"("date_visite");

-- AddForeignKey
ALTER TABLE "visites" ADD CONSTRAINT "visites_motif_id_fkey" FOREIGN KEY ("motif_id") REFERENCES "motifs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visites" ADD CONSTRAINT "visites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visites" ADD CONSTRAINT "visites_medecin_id_fkey" FOREIGN KEY ("medecin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
