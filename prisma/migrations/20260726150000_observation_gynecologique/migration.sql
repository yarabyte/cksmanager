-- CreateTable
CREATE TABLE "observations_gynecologiques" (
    "id" BIGSERIAL NOT NULL,
    "visite_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type_consult" VARCHAR(100),
    "motif_consult" TEXT,
    "ddr" VARCHAR(50),
    "contraception" VARCHAR(255),
    "dernier_fcv" VARCHAR(100),
    "derniere_mammo" VARCHAR(100),
    "menopause" VARCHAR(255),
    "thm" VARCHAR(255),
    "hist_maladie" TEXT,
    "mode_vie_sexuelle" VARCHAR(255),
    "menorragies" VARCHAR(255),
    "metrorragies" VARCHAR(255),
    "dysmenorrhees" VARCHAR(255),
    "algies_pelviennes" VARCHAR(255),
    "dyspareunies" VARCHAR(255),
    "prurit" VARCHAR(255),
    "note_interrogatoire" TEXT,
    "seins" VARCHAR(255),
    "inspection" VARCHAR(255),
    "palpation" VARCHAR(255),
    "eruption_genitale" VARCHAR(255),
    "leucorrhees" VARCHAR(255),
    "metrorragies_exam" VARCHAR(255),
    "col" VARCHAR(255),
    "vagin" VARCHAR(255),
    "auscultation" VARCHAR(255),
    "toucher_vaginal" VARCHAR(255),
    "culs_sac_lateraux" VARCHAR(255),
    "cul_sac_douglas" VARCHAR(255),
    "note_physique" TEXT,
    "echo_pelvienne" TEXT,
    "hypothese_1" TEXT,
    "hypothese_2" TEXT,
    "hypothese_3" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "observations_gynecologiques_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "observations_gynecologiques_visite_id_key" ON "observations_gynecologiques"("visite_id");

-- CreateIndex
CREATE INDEX "observations_gynecologiques_user_id_idx" ON "observations_gynecologiques"("user_id");

-- AddForeignKey
ALTER TABLE "observations_gynecologiques" ADD CONSTRAINT "observations_gynecologiques_visite_id_fkey" FOREIGN KEY ("visite_id") REFERENCES "visites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations_gynecologiques" ADD CONSTRAINT "observations_gynecologiques_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
