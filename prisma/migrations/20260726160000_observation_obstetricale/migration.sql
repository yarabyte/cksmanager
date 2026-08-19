-- CreateTable
CREATE TABLE "observations_obstetricales" (
    "id" BIGSERIAL NOT NULL,
    "visite_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type_observation" VARCHAR(100),
    "motif_consult" TEXT,
    "ddr" VARCHAR(50),
    "date_debut_grossesse" VARCHAR(50),
    "hist_maladie" TEXT,
    "mouvements_foetaux" VARCHAR(255),
    "contractions" VARCHAR(255),
    "ressenties_douloureuses" VARCHAR(20),
    "end_ressenties" VARCHAR(20),
    "perte_liquide_amnio" VARCHAR(20),
    "prurit_vaginal" VARCHAR(20),
    "prurit_nu" VARCHAR(20),
    "signes_hta" VARCHAR(20),
    "glasgow" VARCHAR(50),
    "cephalees" VARCHAR(20),
    "end_cephalees" VARCHAR(20),
    "oedemes_mi" VARCHAR(255),
    "oedemes_mains" VARCHAR(255),
    "oedemes_visage" VARCHAR(255),
    "barre_epigastrique" VARCHAR(255),
    "obnubilation" VARCHAR(255),
    "troubles_vigilance" VARCHAR(255),
    "note_interrogatoire" TEXT,
    "hauteur_uterine_cm" VARCHAR(50),
    "consistance_uterine" VARCHAR(255),
    "malformation_uterine" VARCHAR(255),
    "speculum" VARCHAR(255),
    "metrorragies" VARCHAR(255),
    "perte_liquide_tarnier" VARCHAR(255),
    "aspect_leucorrhees" VARCHAR(255),
    "cds_lateraux" VARCHAR(255),
    "col" VARCHAR(255),
    "presentation" VARCHAR(255),
    "cds_douglas" VARCHAR(255),
    "bishop" VARCHAR(20),
    "note_toucher_vaginal" TEXT,
    "echo_obstetricale" TEXT,
    "hypothese_1" TEXT,
    "hypothese_2" TEXT,
    "hypothese_3" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "observations_obstetricales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "observations_obstetricales_visite_id_key" ON "observations_obstetricales"("visite_id");

-- CreateIndex
CREATE INDEX "observations_obstetricales_user_id_idx" ON "observations_obstetricales"("user_id");

-- AddForeignKey
ALTER TABLE "observations_obstetricales" ADD CONSTRAINT "observations_obstetricales_visite_id_fkey" FOREIGN KEY ("visite_id") REFERENCES "visites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations_obstetricales" ADD CONSTRAINT "observations_obstetricales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
