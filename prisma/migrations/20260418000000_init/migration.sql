-- CreateTable
CREATE TABLE "categorie_actes" (
    "id" BIGSERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "categorie_actes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assurances" (
    "id" BIGSERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "assurances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" BIGSERIAL NOT NULL,
    "civilite" INTEGER NOT NULL,
    "PatName" TEXT NOT NULL,
    "PatSurname" TEXT NOT NULL,
    "nom_jeune_fille" TEXT,
    "PatEmail" VARCHAR(40),
    "PatDOB" DATE NOT NULL,
    "PatLieuNaiss" VARCHAR(50) NOT NULL,
    "PatCNI" VARCHAR(20),
    "PatAdress" VARCHAR(200) NOT NULL,
    "PatNum1" VARCHAR(20) NOT NULL,
    "PatNum2" VARCHAR(20),
    "PatProfession" VARCHAR(100),
    "sexe" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actes" (
    "id" BIGSERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie_id" BIGINT NOT NULL,
    "assureur_id" BIGINT,
    "code_base" TEXT,
    "coefficient" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "valeur_fixe" DOUBLE PRECISION,
    "prix_hnc" DECIMAL(10,2),
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    "impute_assurance" SMALLINT,
    "type_acte" TEXT,

    CONSTRAINT "actes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assurance_patient" (
    "id" BIGSERIAL NOT NULL,
    "patient_id" BIGINT NOT NULL,
    "assurance_id" BIGINT NOT NULL,
    "date_debut" DATE,
    "date_fin" DATE,
    "numero_attestation" TEXT,
    "taux_couverture" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "assurance_patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assurance_patient_couvertures" (
    "id" BIGSERIAL NOT NULL,
    "assurance_patient_id" BIGINT NOT NULL,
    "categorie_id" BIGINT NOT NULL,
    "taux_couverture" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "assurance_patient_couvertures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assurance_valeurs" (
    "id" BIGSERIAL NOT NULL,
    "assurance_id" BIGINT NOT NULL,
    "code_base" TEXT NOT NULL,
    "valeur_unitaire" DOUBLE PRECISION NOT NULL,
    "date_debut" DATE,
    "date_fin" DATE,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "assurance_valeurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametres" (
    "id" BIGSERIAL NOT NULL,
    "nom_clinique" TEXT,
    "logo" TEXT,
    "adresse" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "numero_facture_depart" INTEGER NOT NULL DEFAULT 1,
    "niu" TEXT,
    "registre_commerce" TEXT,
    "note_bas_page_1" TEXT,
    "note_bas_page_2" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "parametres_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "actes_categorie_id_idx" ON "actes"("categorie_id");

-- CreateIndex
CREATE INDEX "actes_assureur_id_idx" ON "actes"("assureur_id");

-- CreateIndex
CREATE INDEX "assurance_patient_patient_id_idx" ON "assurance_patient"("patient_id");

-- CreateIndex
CREATE INDEX "assurance_patient_assurance_id_idx" ON "assurance_patient"("assurance_id");

-- CreateIndex
CREATE INDEX "assurance_patient_couvertures_assurance_patient_id_idx" ON "assurance_patient_couvertures"("assurance_patient_id");

-- CreateIndex
CREATE INDEX "assurance_patient_couvertures_categorie_id_idx" ON "assurance_patient_couvertures"("categorie_id");

-- CreateIndex
CREATE INDEX "assurance_valeurs_assurance_id_idx" ON "assurance_valeurs"("assurance_id");

-- AddForeignKey
ALTER TABLE "actes" ADD CONSTRAINT "actes_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categorie_actes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actes" ADD CONSTRAINT "actes_assureur_id_fkey" FOREIGN KEY ("assureur_id") REFERENCES "assurances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assurance_patient" ADD CONSTRAINT "assurance_patient_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assurance_patient" ADD CONSTRAINT "assurance_patient_assurance_id_fkey" FOREIGN KEY ("assurance_id") REFERENCES "assurances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assurance_patient_couvertures" ADD CONSTRAINT "assurance_patient_couvertures_assurance_patient_id_fkey" FOREIGN KEY ("assurance_patient_id") REFERENCES "assurance_patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assurance_patient_couvertures" ADD CONSTRAINT "assurance_patient_couvertures_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categorie_actes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assurance_valeurs" ADD CONSTRAINT "assurance_valeurs_assurance_id_fkey" FOREIGN KEY ("assurance_id") REFERENCES "assurances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

