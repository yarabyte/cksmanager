-- CreateTable
CREATE TABLE IF NOT EXISTS "parametres_patient" (
    "id" BIGSERIAL NOT NULL,
    "visite_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "poids_kg" DECIMAL(6,2) NOT NULL,
    "taille_cm" DECIMAL(6,1) NOT NULL,
    "imc" DECIMAL(5,1) NOT NULL,
    "pas" SMALLINT NOT NULL,
    "pad" SMALLINT NOT NULL,
    "pouls" SMALLINT NOT NULL,
    "temperature_c" DECIMAL(4,1) NOT NULL,
    "nitrite" VARCHAR(30) NOT NULL,
    "sang" VARCHAR(30) NOT NULL,
    "leucocytes" VARCHAR(30) NOT NULL,
    "proteine" VARCHAR(30) NOT NULL,
    "cetones" VARCHAR(30) NOT NULL,
    "ph" VARCHAR(10) NOT NULL,
    "sucre" VARCHAR(30),
    "perimetre_cranien" DECIMAL(5,1),
    "perimetre_brachial" DECIMAL(5,1),
    "frequence_respiratoire" SMALLINT,
    "sao2" SMALLINT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "parametres_patient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "parametres_patient_visite_id_key" ON "parametres_patient"("visite_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "parametres_patient_user_id_idx" ON "parametres_patient"("user_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "parametres_patient" ADD CONSTRAINT "parametres_patient_visite_id_fkey"
    FOREIGN KEY ("visite_id") REFERENCES "visites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "parametres_patient" ADD CONSTRAINT "parametres_patient_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
