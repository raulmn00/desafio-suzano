-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "ocorrido_em" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicado_em" TIMESTAMP(3),
    "tentativas" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outbox_events_publicado_em_criado_em_idx" ON "outbox_events"("publicado_em", "criado_em");
