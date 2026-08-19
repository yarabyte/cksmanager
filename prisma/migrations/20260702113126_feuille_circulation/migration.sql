-- DropIndex
DROP INDEX IF EXISTS "produits_site_pharma_idx";

-- CreateTable
CREATE TABLE "feuilles_circulation" (
    "id" BIGSERIAL NOT NULL,
    "visite_id" BIGINT NOT NULL,
    "numero" VARCHAR(50) NOT NULL,
    "libelle" VARCHAR(255),
    "statut" VARCHAR(20) NOT NULL DEFAULT 'BROUILLON',
    "user_id" BIGINT NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "feuilles_circulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feuille_circulation_lignes" (
    "id" BIGSERIAL NOT NULL,
    "feuille_id" BIGINT NOT NULL,
    "type_ligne" VARCHAR(10) NOT NULL,
    "categorie_id" BIGINT NOT NULL,
    "acte_id" BIGINT,
    "produit_id" BIGINT,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "taux" SMALLINT NOT NULL DEFAULT 0,
    "valeur" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "hnc" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pu_snapshot" DECIMAL(12,2),
    "remise_unitaire" DECIMAL(12,2),
    "montant_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "montant_assurance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "montant_patient" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "impute_assurance" SMALLINT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feuille_circulation_lignes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feuilles_circulation_numero_key" ON "feuilles_circulation"("numero");

-- CreateIndex
CREATE INDEX "feuilles_circulation_visite_id_idx" ON "feuilles_circulation"("visite_id");

-- CreateIndex
CREATE INDEX "feuilles_circulation_statut_idx" ON "feuilles_circulation"("statut");

-- CreateIndex
CREATE INDEX "feuille_circulation_lignes_feuille_id_idx" ON "feuille_circulation_lignes"("feuille_id");

-- CreateIndex
CREATE INDEX "feuille_circulation_lignes_type_ligne_idx" ON "feuille_circulation_lignes"("type_ligne");

-- CreateIndex
CREATE INDEX "feuille_circulation_lignes_categorie_id_idx" ON "feuille_circulation_lignes"("categorie_id");

-- CreateIndex
CREATE INDEX "feuille_circulation_lignes_acte_id_idx" ON "feuille_circulation_lignes"("acte_id");

-- CreateIndex
CREATE INDEX "feuille_circulation_lignes_produit_id_idx" ON "feuille_circulation_lignes"("produit_id");

-- AddForeignKey
ALTER TABLE "feuilles_circulation" ADD CONSTRAINT "feuilles_circulation_visite_id_fkey" FOREIGN KEY ("visite_id") REFERENCES "visites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feuilles_circulation" ADD CONSTRAINT "feuilles_circulation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feuille_circulation_lignes" ADD CONSTRAINT "feuille_circulation_lignes_feuille_id_fkey" FOREIGN KEY ("feuille_id") REFERENCES "feuilles_circulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feuille_circulation_lignes" ADD CONSTRAINT "feuille_circulation_lignes_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categorie_actes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feuille_circulation_lignes" ADD CONSTRAINT "feuille_circulation_lignes_acte_id_fkey" FOREIGN KEY ("acte_id") REFERENCES "actes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feuille_circulation_lignes" ADD CONSTRAINT "feuille_circulation_lignes_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feuille_circulation_lignes" ADD CONSTRAINT "feuille_circulation_lignes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
