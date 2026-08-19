-- CreateTable
CREATE TABLE "conditionnements" (
    "id" BIGSERIAL NOT NULL,
    "libelle" VARCHAR(255) NOT NULL,
    "is_common" BOOLEAN NOT NULL DEFAULT true,
    "rank" SMALLINT NOT NULL DEFAULT 100,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "conditionnements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formes_galeniques" (
    "id" BIGSERIAL NOT NULL,
    "libelle" VARCHAR(255) NOT NULL,
    "is_common" BOOLEAN NOT NULL DEFAULT true,
    "rank" SMALLINT NOT NULL DEFAULT 100,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "formes_galeniques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fournisseurs" (
    "id" BIGSERIAL NOT NULL,
    "raison_sociale" VARCHAR(255) NOT NULL,
    "adresse" VARCHAR(255),
    "telephone1" VARCHAR(255),
    "telephone2" VARCHAR(255),
    "email" VARCHAR(255),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "fournisseurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits" (
    "id" BIGSERIAL NOT NULL,
    "nom" VARCHAR(255) NOT NULL,
    "principe_actif" VARCHAR(255),
    "code_cip" VARCHAR(255),
    "forme_galenique_id" BIGINT NOT NULL,
    "dosage" VARCHAR(255) NOT NULL,
    "conditionnement_id" BIGINT NOT NULL,
    "qte_par_conditionnement" INTEGER NOT NULL,
    "prix_achat_ref" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "prix_vente_ref" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "hnc" DECIMAL(12,2),
    "qte_alerte" INTEGER NOT NULL DEFAULT 0,
    "assureur_id" BIGINT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conditionnements_libelle_key" ON "conditionnements"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "formes_galeniques_libelle_key" ON "formes_galeniques"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "fournisseurs_raison_sociale_key" ON "fournisseurs"("raison_sociale");

-- CreateIndex
CREATE UNIQUE INDEX "produits_code_cip_key" ON "produits"("code_cip");

-- CreateIndex
CREATE INDEX "produits_nom_idx" ON "produits"("nom");

-- CreateIndex
CREATE INDEX "produits_principe_actif_idx" ON "produits"("principe_actif");

-- CreateIndex
CREATE INDEX "produits_forme_galenique_id_idx" ON "produits"("forme_galenique_id");

-- CreateIndex
CREATE INDEX "produits_conditionnement_id_idx" ON "produits"("conditionnement_id");

-- CreateIndex
CREATE INDEX "produits_assureur_id_idx" ON "produits"("assureur_id");

-- AddForeignKey
ALTER TABLE "produits" ADD CONSTRAINT "produits_forme_galenique_id_fkey" FOREIGN KEY ("forme_galenique_id") REFERENCES "formes_galeniques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits" ADD CONSTRAINT "produits_conditionnement_id_fkey" FOREIGN KEY ("conditionnement_id") REFERENCES "conditionnements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits" ADD CONSTRAINT "produits_assureur_id_fkey" FOREIGN KEY ("assureur_id") REFERENCES "assurances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
