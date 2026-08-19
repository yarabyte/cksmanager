-- Portemonnaie patient (1 par patient, solde = somme des transactions)

CREATE TABLE "wallets" (
    "id" BIGSERIAL NOT NULL,
    "patient_id" BIGINT NOT NULL,
    "user_id" BIGINT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallet_transactions" (
    "id" BIGSERIAL NOT NULL,
    "wallet_id" BIGINT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "montant" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "transactionable_type" VARCHAR(255),
    "transactionable_id" BIGINT,
    "user_id" BIGINT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wallets_patient_id_key" ON "wallets"("patient_id");
CREATE INDEX "wallet_transactions_wallet_id_idx" ON "wallet_transactions"("wallet_id");
CREATE INDEX "wallet_transactions_transactionable_type_transactionable_id_idx" ON "wallet_transactions"("transactionable_type", "transactionable_id");

ALTER TABLE "wallets" ADD CONSTRAINT "wallets_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
