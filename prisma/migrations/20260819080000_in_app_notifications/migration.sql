-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "href" VARCHAR(255),
    "entity_type" VARCHAR(50),
    "entity_id" BIGINT,
    "actor_user_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_recipients" (
    "id" BIGSERIAL NOT NULL,
    "notification_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_type_created_at_idx" ON "notifications"("type", "created_at");

-- CreateIndex
CREATE INDEX "notification_recipients_user_id_read_at_idx" ON "notification_recipients"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notification_recipients_user_id_notification_id_idx" ON "notification_recipients"("user_id", "notification_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_recipients_notification_id_user_id_key" ON "notification_recipients"("notification_id", "user_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
