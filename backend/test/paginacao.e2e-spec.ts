import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hashSync } from 'bcryptjs';
import { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/app.setup';
import { PrismaService } from '../src/shared/infrastructure/persistence/prisma.service';

/**
 * Paginação (envelope offset-based) de /ordens-venda e /auditoria.
 */
describe('OVGS API — Paginação (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Server;
  let op: string;

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
      'TRUNCATE TABLE "audit_events","agendamentos","itens_ordem_venda","ordens_venda",' +
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
    const tipoId = (
      await request(server)
        .post(url('/tipos-transporte'))
        .set(...bearer(op))
        .send({ nome: 'C', codigo: 'CAM' })
    ).body.id;
    const itemId = (
      await request(server)
        .post(url('/itens'))
        .set(...bearer(op))
        .send({ sku: 'S1', descricao: 'x', unidade: 'UN' })
    ).body.id;
    const clienteId = (
      await request(server)
        .post(url('/clientes'))
        .set(...bearer(op))
        .send({ nome: 'Cli', documento: '11222333000181' })
    ).body.id;
    await request(server)
      .post(url(`/clientes/${clienteId}/transportes`))
      .set(...bearer(op))
      .send({ tipoTransporteId: tipoId });
    for (let i = 0; i < 3; i += 1) {
      await request(server)
        .post(url('/ordens-venda'))
        .set(...bearer(op))
        .send({ clienteId, tipoTransporteId: tipoId, itens: [{ itemId, quantidade: 1 }] })
        .expect(201);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /ordens-venda retorna envelope com defaults (page=1, limit=20)', async () => {
    const res = await request(server)
      .get(url('/ordens-venda'))
      .set(...bearer(op))
      .expect(200);
    expect(res.body).toMatchObject({ page: 1, limit: 20, total: 3, totalPages: 1 });
    expect(res.body.data).toHaveLength(3);
  });

  it('respeita page e limit (skip/take + totalPages)', async () => {
    const p1 = await request(server)
      .get(url('/ordens-venda?page=1&limit=2'))
      .set(...bearer(op))
      .expect(200);
    expect(p1.body).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });
    expect(p1.body.data).toHaveLength(2);

    const p2 = await request(server)
      .get(url('/ordens-venda?page=2&limit=2'))
      .set(...bearer(op))
      .expect(200);
    expect(p2.body.data).toHaveLength(1);
    // páginas não se sobrepõem
    const ids1 = p1.body.data.map((o: { id: string }) => o.id);
    const ids2 = p2.body.data.map((o: { id: string }) => o.id);
    expect(ids1.some((id: string) => ids2.includes(id))).toBe(false);
  });

  it('limit acima do máximo (100) → 400', () =>
    request(server)
      .get(url('/ordens-venda?limit=200'))
      .set(...bearer(op))
      .expect(400));

  it('page inválida (0) → 400', () =>
    request(server)
      .get(url('/ordens-venda?page=0'))
      .set(...bearer(op))
      .expect(400));

  it('GET /auditoria também é paginado (envelope)', async () => {
    const res = await request(server)
      .get(url('/auditoria?limit=2'))
      .set(...bearer(op))
      .expect(200);
    expect(res.body).toMatchObject({ page: 1, limit: 2 });
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
