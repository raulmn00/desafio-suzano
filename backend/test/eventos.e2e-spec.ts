import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hashSync } from 'bcryptjs';
import { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/app.setup';
import { OutboxRelay } from '../src/shared/infrastructure/events/outbox-relay';
import { PrismaService } from '../src/shared/infrastructure/persistence/prisma.service';

/**
 * Event-Driven Architecture ponta a ponta: criar uma OV e mudar o status
 * disparam eventos de domínio cujos handlers alimentam as métricas de negócio
 * (`ordens_venda_eventos_total`), visíveis em `/metrics`.
 */
describe('OVGS API — Eventos de domínio (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Server;
  let op: string;
  let clienteId: string;
  let tipoId: string;
  let itemId: string;

  const url = (p: string) => `/api/v1${p}`;
  const bearer = (t: string) => ['Authorization', `Bearer ${t}`] as [string, string];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    server = app.getHttpServer() as Server;

    await prisma.client.$executeRawUnsafe(
      'TRUNCATE TABLE "outbox_events","audit_events","agendamentos","itens_ordem_venda","ordens_venda",' +
        '"clientes_tipos_transporte","clientes","tipos_transporte","itens",' +
        '"access_tokens_revogados","refresh_tokens","usuarios" RESTART IDENTITY CASCADE',
    );
    await prisma.client.usuario.create({
      data: {
        id: randomUUID(),
        email: 'operador@ovgs.dev',
        nome: 'Operador',
        senhaHash: hashSync('operador123', 8),
        papel: 'OPERADOR',
        ativo: true,
      },
    });
    op = (
      await request(server)
        .post(url('/auth/login'))
        .send({ email: 'operador@ovgs.dev', senha: 'operador123' })
    ).body.accessToken;
    tipoId = (
      await request(server)
        .post(url('/tipos-transporte'))
        .set(...bearer(op))
        .send({ nome: 'Caminhão', codigo: 'CAM' })
    ).body.id;
    itemId = (
      await request(server)
        .post(url('/itens'))
        .set(...bearer(op))
        .send({ sku: 'SKU-1', descricao: 'Item', unidade: 'UN' })
    ).body.id;
    clienteId = (
      await request(server)
        .post(url('/clientes'))
        .set(...bearer(op))
        .send({ nome: 'Cliente', documento: '11222333000181' })
    ).body.id;
    await request(server)
      .post(url(`/clientes/${clienteId}/transportes`))
      .set(...bearer(op))
      .send({ tipoTransporteId: tipoId });
  });

  afterAll(async () => {
    await app.close();
  });

  it('criar OV e mudar status incrementam ordens_venda_eventos_total via handlers', async () => {
    const ov = (
      await request(server)
        .post(url('/ordens-venda'))
        .set(...bearer(op))
        .send({ clienteId, tipoTransporteId: tipoId, itens: [{ itemId, quantidade: 1 }] })
        .expect(201)
    ).body;

    await request(server)
      .patch(url(`/ordens-venda/${ov.id}/status`))
      .set(...bearer(op))
      .send({ status: 'PLANEJADA' })
      .expect(200);

    // Pipeline agora é assíncrono (outbox → relay → handler): força a entrega
    // dos eventos pendentes antes de checar as métricas (determinístico).
    await app.get(OutboxRelay).processarPendentes();

    const metrics = (await request(server).get('/metrics').expect(200)).text;
    expect(metrics).toMatch(/ordens_venda_eventos_total\{tipo="criada"\} [1-9]/);
    expect(metrics).toMatch(/ordens_venda_eventos_total\{tipo="status_alterado"\} [1-9]/);
  });
});
