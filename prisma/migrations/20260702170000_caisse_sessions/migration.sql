-- Sessions de caisse multi-utilisateurs

ALTER TABLE "parametres" ADD COLUMN IF NOT EXISTS "numero_versement_depart" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS "caisse_postes" (
    "id" BIGSERIAL NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "caisse_postes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "caisse_postes_nom_key" ON "caisse_postes"("nom");

CREATE TABLE IF NOT EXISTS "caisse_sessions" (
    "id" BIGSERIAL NOT NULL,
    "poste_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "statut" VARCHAR(20) NOT NULL,
    "solde_ouverture" DECIMAL(12,2) NOT NULL,
    "solde_theorique_cloture" DECIMAL(12,2),
    "solde_reel_cloture" DECIMAL(12,2),
    "ecart" DECIMAL(12,2),
    "commentaire_ecart" VARCHAR(500),
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "caisse_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "versements_caisse" (
    "id" BIGSERIAL NOT NULL,
    "session_id" BIGINT NOT NULL,
    "numero" VARCHAR(50) NOT NULL,
    "montant" DECIMAL(12,2) NOT NULL,
    "libelle" VARCHAR(500) NOT NULL,
    "beneficiaire" VARCHAR(255),
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "versements_caisse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "versements_caisse_numero_key" ON "versements_caisse"("numero");

ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "session_id" BIGINT;
ALTER TABLE "encaissements" ADD COLUMN IF NOT EXISTS "session_id" BIGINT;
ALTER TABLE "journal_caisse" ADD COLUMN IF NOT EXISTS "session_id" BIGINT;
ALTER TABLE "journal_caisse" ADD COLUMN IF NOT EXISTS "versement_id" BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS "journal_caisse_versement_id_key" ON "journal_caisse"("versement_id");

ALTER TABLE "caisse_sessions" ADD CONSTRAINT "caisse_sessions_poste_id_fkey" FOREIGN KEY ("poste_id") REFERENCES "caisse_postes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "caisse_sessions" ADD CONSTRAINT "caisse_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "versements_caisse" ADD CONSTRAINT "versements_caisse_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "caisse_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "versements_caisse" ADD CONSTRAINT "versements_caisse_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
