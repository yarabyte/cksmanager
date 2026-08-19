-- CreateTable
CREATE TABLE "magasins" (
    "id" BIGSERIAL NOT NULL,
    "nom" VARCHAR(255) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "magasins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kit_actes" (
    "id" BIGSERIAL NOT NULL,
    "nom" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "user_id" BIGINT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "kit_actes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kit_acte_lignes" (
    "id" BIGSERIAL NOT NULL,
    "kit_acte_id" BIGINT NOT NULL,
    "type_ligne" VARCHAR(10) NOT NULL,
    "acte_id" BIGINT,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "produit_id" BIGINT,
    "magasin_id" BIGINT,
    "remise_unitaire" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "kit_acte_lignes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kit_actes_nom_key" ON "kit_actes"("nom");

-- CreateIndex
CREATE INDEX "kit_actes_user_id_idx" ON "kit_actes"("user_id");

-- CreateIndex
CREATE INDEX "kit_actes_actif_idx" ON "kit_actes"("actif");

-- CreateIndex
CREATE INDEX "kit_acte_lignes_kit_acte_id_idx" ON "kit_acte_lignes"("kit_acte_id");

-- CreateIndex
CREATE INDEX "kit_acte_lignes_type_ligne_idx" ON "kit_acte_lignes"("type_ligne");

-- CreateIndex
CREATE INDEX "kit_acte_lignes_acte_id_idx" ON "kit_acte_lignes"("acte_id");

-- CreateIndex
CREATE INDEX "kit_acte_lignes_produit_id_magasin_id_idx" ON "kit_acte_lignes"("produit_id", "magasin_id");

-- AddForeignKey
ALTER TABLE "kit_actes" ADD CONSTRAINT "kit_actes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kit_acte_lignes" ADD CONSTRAINT "kit_acte_lignes_kit_acte_id_fkey" FOREIGN KEY ("kit_acte_id") REFERENCES "kit_actes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kit_acte_lignes" ADD CONSTRAINT "kit_acte_lignes_acte_id_fkey" FOREIGN KEY ("acte_id") REFERENCES "actes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kit_acte_lignes" ADD CONSTRAINT "kit_acte_lignes_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kit_acte_lignes" ADD CONSTRAINT "kit_acte_lignes_magasin_id_fkey" FOREIGN KEY ("magasin_id") REFERENCES "magasins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
