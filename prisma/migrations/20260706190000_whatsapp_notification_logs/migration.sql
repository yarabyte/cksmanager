-- CreateTable
CREATE TABLE "whatsapp_notification_logs" (
    "id" BIGSERIAL NOT NULL,
    "event_type" VARCHAR(40) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "patient_id" BIGINT,
    "phone" VARCHAR(20) NOT NULL,
    "reference_type" VARCHAR(50),
    "reference_id" BIGINT,
    "message_preview" VARCHAR(500),
    "error_message" TEXT,
    "wasender_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "whatsapp_notification_logs_event_type_created_at_idx" ON "whatsapp_notification_logs"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "whatsapp_notification_logs_reference_type_reference_id_idx" ON "whatsapp_notification_logs"("reference_type", "reference_id");
