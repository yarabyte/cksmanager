-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" VARCHAR(6),
    "email_verified_at" TIMESTAMP(3),
    "password" TEXT NOT NULL,
    "telephone" VARCHAR(255),
    "photo" VARCHAR(255),
    "specialite" VARCHAR(255),
    "numero_ordre" VARCHAR(255),
    "role" VARCHAR(255),
    "titre" VARCHAR(255),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "remember_token" VARCHAR(100),
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
