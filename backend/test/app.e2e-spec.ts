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
 * Teste de integração ponta a ponta: sobe a aplicação completa contra um
 * PostgreSQL real e exercita o ciclo de vida completo de uma Ordem de Venda,
 * incluindo autenticação, RBAC, regra de transporte autorizado, máquina de
 * estados, central de agendamento e trilha de auditoria.
 */
describe('OVGS API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: Server;
  let token: string;

  const headers = (): Record<string, string> => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configurarApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer() as Server;

    await prisma.client.$executeRawUnsafe(
      'TRUNCATE TABLE "outbox_events","audit_events","agendamentos","itens_ordem_venda","ordens_venda",' +
        '"clientes_tipos_transporte","clientes","tipos_transporte","itens","usuarios" ' +
        'RESTART IDENTITY CASCADE',
    );

    await prisma.client.usuario.create({
      data: {
        id: randomUUID(),
        email: 'op@ovgs.dev',
        nome: 'Operador',
        senhaHash: hashSync('senha123', 8),
        papel: 'OPERADOR',
        ativo: true,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  let tipoId: string;
  let itemId: string;
  let clienteId: string;
  let ordemId: string;

  it('GET /health é público e responde ok', async () => {
    const res = await request(httpServer).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('rejeita login inválido com 401', () =>
    request(httpServer)
      .post('/api/v1/auth/login')
      .send({ email: 'op@ovgs.dev', senha: 'errada' })
      .expect(401));

  it('autentica e devolve token', async () => {
    const res = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ email: 'op@ovgs.dev', senha: 'senha123' })
      .expect(200);
    token = res.body.accessToken;
    expect(token).toEqual(expect.any(String));
  });

  it('bloqueia rota protegida sem token (401)', () =>
    request(httpServer).get('/api/v1/clientes').expect(401));

  it('cadastra tipo de transporte, item e cliente', async () => {
    const tipo = await request(httpServer)
      .post('/api/v1/tipos-transporte')
      .set(headers())
      .send({ nome: 'Caminhão', codigo: 'CAM' })
      .expect(201);
    tipoId = tipo.body.id;

    const item = await request(httpServer)
      .post('/api/v1/itens')
      .set(headers())
      .send({ sku: 'SKU-1', descricao: 'Pallet', unidade: 'PL' })
      .expect(201);
    itemId = item.body.id;

    const cliente = await request(httpServer)
      .post('/api/v1/clientes')
      .set(headers())
      .send({ nome: 'Acme', documento: '52998224725' })
      .expect(201);
    clienteId = cliente.body.id;
  });

  it('rejeita criar OV com transporte não autorizado (422)', () =>
    request(httpServer)
      .post('/api/v1/ordens-venda')
      .set(headers())
      .send({ clienteId, tipoTransporteId: tipoId, itens: [{ itemId, quantidade: 2 }] })
      .expect(422));

  it('autoriza o transporte e cria a OV (CRIADA)', async () => {
    await request(httpServer)
      .post(`/api/v1/clientes/${clienteId}/transportes`)
      .set(headers())
      .send({ tipoTransporteId: tipoId })
      .expect(201);

    const res = await request(httpServer)
      .post('/api/v1/ordens-venda')
      .set(headers())
      .send({ clienteId, tipoTransporteId: tipoId, itens: [{ itemId, quantidade: 2 }] })
      .expect(201);
    ordemId = res.body.id;
    expect(res.body.status).toBe('CRIADA');
  });

  it('rejeita transição inválida CRIADA → AGENDADA (422)', () =>
    request(httpServer)
      .patch(`/api/v1/ordens-venda/${ordemId}/status`)
      .set(headers())
      .send({ status: 'AGENDADA' })
      .expect(422));

  it('percorre o fluxo até ENTREGUE', async () => {
    await request(httpServer)
      .patch(`/api/v1/ordens-venda/${ordemId}/status`)
      .set(headers())
      .send({ status: 'PLANEJADA' })
      .expect(200);

    await request(httpServer)
      .post(`/api/v1/ordens-venda/${ordemId}/agendamento`)
      .set(headers())
      .send({ dataEntrega: '2026-07-01', janelaInicio: '08:00', janelaFim: '12:00' })
      .expect(201);

    await request(httpServer)
      .post(`/api/v1/ordens-venda/${ordemId}/agendamento/confirmar`)
      .set(headers())
      .expect(201);

    for (const status of ['AGENDADA', 'EM_TRANSPORTE', 'ENTREGUE']) {
      await request(httpServer)
        .patch(`/api/v1/ordens-venda/${ordemId}/status`)
        .set(headers())
        .send({ status })
        .expect(200);
    }

    const detalhe = await request(httpServer)
      .get(`/api/v1/ordens-venda/${ordemId}`)
      .set(headers())
      .expect(200);
    expect(detalhe.body.status).toBe('ENTREGUE');
    expect(detalhe.body.agendamento.confirmado).toBe(true);
  });

  it('monitoramento filtra por status ENTREGUE', async () => {
    const res = await request(httpServer)
      .get('/api/v1/ordens-venda')
      .query({ status: 'ENTREGUE' })
      .set(headers())
      .expect(200);
    expect(res.body.data.map((o: { id: string }) => o.id)).toContain(ordemId);
    expect(res.body).toMatchObject({ page: 1, limit: 20, total: expect.any(Number) });
  });

  it('a trilha de auditoria registrou os eventos da OV', async () => {
    const res = await request(httpServer)
      .get('/api/v1/auditoria')
      .query({ entidadeId: ordemId })
      .set(headers())
      .expect(200);
    const acoes = res.body.data.map((e: { acao: string }) => e.acao);
    expect(acoes).toEqual(
      expect.arrayContaining([
        'ORDEM_VENDA_CRIADA',
        'ORDEM_VENDA_STATUS_ALTERADO',
        'ORDEM_VENDA_AGENDAMENTO_DEFINIDO',
        'ORDEM_VENDA_AGENDAMENTO_CONFIRMADO',
      ]),
    );
  });
});
