-- CreateEnum
CREATE TYPE "StatusOrdemVenda" AS ENUM ('CRIADA', 'PLANEJADA', 'AGENDADA', 'EM_TRANSPORTE', 'ENTREGUE');

-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('OPERADOR', 'AUDITOR');

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_transporte" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_transporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes_tipos_transporte" (
    "cliente_id" TEXT NOT NULL,
    "tipo_transporte_id" TEXT NOT NULL,
    "autorizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_tipos_transporte_pkey" PRIMARY KEY ("cliente_id","tipo_transporte_id")
);

-- CreateTable
CREATE TABLE "itens" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens_venda" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "tipo_transporte_id" TEXT NOT NULL,
    "status" "StatusOrdemVenda" NOT NULL DEFAULT 'CRIADA',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordens_venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_ordem_venda" (
    "id" TEXT NOT NULL,
    "ordem_venda_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "itens_ordem_venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamentos" (
    "id" TEXT NOT NULL,
    "ordem_venda_id" TEXT NOT NULL,
    "data_entrega" TIMESTAMP(3) NOT NULL,
    "janela_inicio" TEXT NOT NULL,
    "janela_fim" TEXT NOT NULL,
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "ocorrido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ator" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade_tipo" TEXT NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "estado_anterior" JSONB,
    "estado_posterior" JSONB,
    "correlation_id" TEXT,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL DEFAULT 'OPERADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_documento_key" ON "clientes"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_transporte_codigo_key" ON "tipos_transporte"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "itens_sku_key" ON "itens"("sku");

-- CreateIndex
CREATE INDEX "ordens_venda_status_idx" ON "ordens_venda"("status");

-- CreateIndex
CREATE INDEX "ordens_venda_cliente_id_idx" ON "ordens_venda"("cliente_id");

-- CreateIndex
CREATE INDEX "ordens_venda_tipo_transporte_id_idx" ON "ordens_venda"("tipo_transporte_id");

-- CreateIndex
CREATE INDEX "ordens_venda_criado_em_idx" ON "ordens_venda"("criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "itens_ordem_venda_ordem_venda_id_item_id_key" ON "itens_ordem_venda"("ordem_venda_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "agendamentos_ordem_venda_id_key" ON "agendamentos"("ordem_venda_id");

-- CreateIndex
CREATE INDEX "audit_events_entidade_tipo_entidade_id_idx" ON "audit_events"("entidade_tipo", "entidade_id");

-- CreateIndex
CREATE INDEX "audit_events_acao_idx" ON "audit_events"("acao");

-- CreateIndex
CREATE INDEX "audit_events_ocorrido_em_idx" ON "audit_events"("ocorrido_em");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "clientes_tipos_transporte" ADD CONSTRAINT "clientes_tipos_transporte_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes_tipos_transporte" ADD CONSTRAINT "clientes_tipos_transporte_tipo_transporte_id_fkey" FOREIGN KEY ("tipo_transporte_id") REFERENCES "tipos_transporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_venda" ADD CONSTRAINT "ordens_venda_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_venda" ADD CONSTRAINT "ordens_venda_tipo_transporte_id_fkey" FOREIGN KEY ("tipo_transporte_id") REFERENCES "tipos_transporte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_ordem_venda" ADD CONSTRAINT "itens_ordem_venda_ordem_venda_id_fkey" FOREIGN KEY ("ordem_venda_id") REFERENCES "ordens_venda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_ordem_venda" ADD CONSTRAINT "itens_ordem_venda_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "itens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_ordem_venda_id_fkey" FOREIGN KEY ("ordem_venda_id") REFERENCES "ordens_venda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
