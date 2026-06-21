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
 * Suíte exaustiva de edge cases (validação, RBAC, unicidade, não-encontrado,
 * máquina de estados, regras de negócio, agendamento e auditoria) contra a
 * aplicação completa + Postgres real. Cada caso valida o status HTTP e o código
 * de erro do envelope { statusCode, code, message, timestamp }.
 */
describe('OVGS API — Edge cases (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Server;
  let op: string; // token OPERADOR
  let aud: string; // token AUDITOR

  let tipoAId: string; // autorizado para o cliente
  let tipoBId: string; // NÃO autorizado
  let itemXId: string;
  let clienteId: string;
  const docCNPJ = '11222333000181';

  const url = (p: string) => `/api/v1${p}`;
  const bearer = (t: string) => ['Authorization', `Bearer ${t}`] as [string, string];

  // Helpers de OV em estados específicos (cada teste usa a sua, isolada).
  async function novaOV(): Promise<string> {
    const res = await request(server)
      .post(url('/ordens-venda'))
      .set(...bearer(op))
      .send({ clienteId, tipoTransporteId: tipoAId, itens: [{ itemId: itemXId, quantidade: 1 }] })
      .expect(201);
    return res.body.id as string;
  }
  async function ovPlanejada(): Promise<string> {
    const id = await novaOV();
    await request(server)
      .patch(url(`/ordens-venda/${id}/status`))
      .set(...bearer(op))
      .send({ status: 'PLANEJADA' })
      .expect(200);
    return id;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    server = app.getHttpServer() as Server;

    await prisma.client.$executeRawUnsafe(
      'TRUNCATE TABLE "outbox_events","audit_events","agendamentos","itens_ordem_venda","ordens_venda",' +
        '"clientes_tipos_transporte","clientes","tipos_transporte","itens","usuarios" ' +
        'RESTART IDENTITY CASCADE',
    );
    await prisma.client.usuario.createMany({
      data: [
        {
          id: randomUUID(),
          email: 'operador@ovgs.dev',
          nome: 'Operador',
          senhaHash: hashSync('operador123', 8),
          papel: 'OPERADOR',
          ativo: true,
        },
        {
          id: randomUUID(),
          email: 'auditor@ovgs.dev',
          nome: 'Auditor',
          senhaHash: hashSync('auditor123', 8),
          papel: 'AUDITOR',
          ativo: true,
        },
      ],
    });

    op = (
      await request(server)
        .post(url('/auth/login'))
        .send({ email: 'operador@ovgs.dev', senha: 'operador123' })
        .expect(200)
    ).body.accessToken;
    aud = (
      await request(server)
        .post(url('/auth/login'))
        .send({ email: 'auditor@ovgs.dev', senha: 'auditor123' })
        .expect(200)
    ).body.accessToken;

    tipoAId = (
      await request(server)
        .post(url('/tipos-transporte'))
        .set(...bearer(op))
        .send({ nome: 'Caminhão', codigo: 'CAM' })
        .expect(201)
    ).body.id;
    tipoBId = (
      await request(server)
        .post(url('/tipos-transporte'))
        .set(...bearer(op))
        .send({ nome: 'Carreta', codigo: 'CAR' })
        .expect(201)
    ).body.id;
    itemXId = (
      await request(server)
        .post(url('/itens'))
        .set(...bearer(op))
        .send({ sku: 'SKU-X', descricao: 'Item X', unidade: 'UN' })
        .expect(201)
    ).body.id;
    clienteId = (
      await request(server)
        .post(url('/clientes'))
        .set(...bearer(op))
        .send({ nome: 'Cliente', documento: docCNPJ })
        .expect(201)
    ).body.id;
    await request(server)
      .post(url(`/clientes/${clienteId}/transportes`))
      .set(...bearer(op))
      .send({ tipoTransporteId: tipoAId })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Autenticação e RBAC', () => {
    it('login com senha errada → 401 UNAUTHORIZED', async () => {
      const r = await request(server)
        .post(url('/auth/login'))
        .send({ email: 'operador@ovgs.dev', senha: 'errada' });
      expect(r.status).toBe(401);
      expect(r.body.code).toBe('UNAUTHORIZED');
    });
    it('login de usuário inexistente → 401', async () => {
      const r = await request(server)
        .post(url('/auth/login'))
        .send({ email: 'x@x.com', senha: 'x' });
      expect(r.status).toBe(401);
    });
    it('login sem senha → 400', () =>
      request(server).post(url('/auth/login')).send({ email: 'operador@ovgs.dev' }).expect(400));
    it('login com e-mail inválido → 400', () =>
      request(server)
        .post(url('/auth/login'))
        .send({ email: 'naoeumemail', senha: 'x' })
        .expect(400));
    it('login com campo extra (whitelist) → 400', () =>
      request(server)
        .post(url('/auth/login'))
        .send({ email: 'operador@ovgs.dev', senha: 'operador123', extra: 1 })
        .expect(400));
    it('rota protegida sem token → 401', () => request(server).get(url('/clientes')).expect(401));
    it('rota protegida com token inválido → 401', () =>
      request(server).get(url('/clientes')).set('Authorization', 'Bearer abc.def.ghi').expect(401));
    it('AUDITOR não pode criar (RBAC) → 403', () =>
      request(server)
        .post(url('/tipos-transporte'))
        .set(...bearer(aud))
        .send({ nome: 'X', codigo: 'ZZZ' })
        .expect(403));
    it('AUDITOR pode ler auditoria → 200', () =>
      request(server)
        .get(url('/auditoria'))
        .set(...bearer(aud))
        .expect(200));
  });

  describe('Validação de entrada (400)', () => {
    it('JSON malformado → 400', () =>
      request(server)
        .post(url('/tipos-transporte'))
        .set(...bearer(op))
        .set('Content-Type', 'application/json')
        .send('{ "nome": ')
        .expect(400));
    it('POST sem body → 400', () =>
      request(server)
        .post(url('/clientes'))
        .set(...bearer(op))
        .expect(400));
    it('tipo sem código → 400', () =>
      request(server)
        .post(url('/tipos-transporte'))
        .set(...bearer(op))
        .send({ nome: 'Sem código' })
        .expect(400));
    it('tipo com campo desconhecido (whitelist) → 400', () =>
      request(server)
        .post(url('/tipos-transporte'))
        .set(...bearer(op))
        .send({ nome: 'X', codigo: 'WL', hacker: true })
        .expect(400));
    it('tipo nome acima do MaxLength → 400', () =>
      request(server)
        .post(url('/tipos-transporte'))
        .set(...bearer(op))
        .send({ nome: 'A'.repeat(200), codigo: 'ML' })
        .expect(400));
    it('item sem unidade → 400', () =>
      request(server)
        .post(url('/itens'))
        .set(...bearer(op))
        .send({ sku: 'SKU-Z', descricao: 'Z' })
        .expect(400));
    it('cliente sem nome → 400', () =>
      request(server)
        .post(url('/clientes'))
        .set(...bearer(op))
        .send({ documento: '52998224725' })
        .expect(400));
    it('autorizar transporte com id vazio → 400', () =>
      request(server)
        .post(url(`/clientes/${clienteId}/transportes`))
        .set(...bearer(op))
        .send({ tipoTransporteId: '' })
        .expect(400));
    it('OV com itens vazios → 400', () =>
      request(server)
        .post(url('/ordens-venda'))
        .set(...bearer(op))
        .send({ clienteId, tipoTransporteId: tipoAId, itens: [] })
        .expect(400));
    it('OV com quantidade 0 → 400', () =>
      request(server)
        .post(url('/ordens-venda'))
        .set(...bearer(op))
        .send({ clienteId, tipoTransporteId: tipoAId, itens: [{ itemId: itemXId, quantidade: 0 }] })
        .expect(400));
    it('OV com quantidade negativa → 400', () =>
      request(server)
        .post(url('/ordens-venda'))
        .set(...bearer(op))
        .send({
          clienteId,
          tipoTransporteId: tipoAId,
          itens: [{ itemId: itemXId, quantidade: -3 }],
        })
        .expect(400));
    it('OV com quantidade decimal (IsInt) → 400', () =>
      request(server)
        .post(url('/ordens-venda'))
        .set(...bearer(op))
        .send({
          clienteId,
          tipoTransporteId: tipoAId,
          itens: [{ itemId: itemXId, quantidade: 2.5 }],
        })
        .expect(400));
    it('OV com quantidade não numérica → 400', () =>
      request(server)
        .post(url('/ordens-venda'))
        .set(...bearer(op))
        .send({
          clienteId,
          tipoTransporteId: tipoAId,
          itens: [{ itemId: itemXId, quantidade: 'abc' }],
        })
        .expect(400));
    it('OV com itens não-array → 400', () =>
      request(server)
        .post(url('/ordens-venda'))
        .set(...bearer(op))
        .send({ clienteId, tipoTransporteId: tipoAId, itens: 'x' })
        .expect(400));
    it('status fora do enum → 400', async () => {
      const id = await novaOV();
      await request(server)
        .patch(url(`/ordens-venda/${id}/status`))
        .set(...bearer(op))
        .send({ status: 'VOANDO' })
        .expect(400);
    });
  });

  describe('Unicidade / conflitos (409)', () => {
    it('código de transporte duplicado → 409 CONFLICT', async () => {
      const r = await request(server)
        .post(url('/tipos-transporte'))
        .set(...bearer(op))
        .send({ nome: 'Outro', codigo: 'CAM' });
      expect(r.status).toBe(409);
      expect(r.body.code).toBe('CONFLICT');
    });
    it('SKU duplicado → 409', () =>
      request(server)
        .post(url('/itens'))
        .set(...bearer(op))
        .send({ sku: 'SKU-X', descricao: 'Dup', unidade: 'UN' })
        .expect(409));
    it('documento duplicado → 409', () =>
      request(server)
        .post(url('/clientes'))
        .set(...bearer(op))
        .send({ nome: 'Dup', documento: docCNPJ })
        .expect(409));
    it('PATCH código para o de outro tipo → 409', () =>
      request(server)
        .patch(url(`/tipos-transporte/${tipoAId}`))
        .set(...bearer(op))
        .send({ codigo: 'CAR' })
        .expect(409));
    it('PATCH mantendo o mesmo código → 200', () =>
      request(server)
        .patch(url(`/tipos-transporte/${tipoAId}`))
        .set(...bearer(op))
        .send({ codigo: 'CAM' })
        .expect(200));
  });

  describe('Documento CPF/CNPJ', () => {
    it('documento curto/ inválido → 422 DOMAIN_VALIDATION', async () => {
      const r = await request(server)
        .post(url('/clientes'))
        .set(...bearer(op))
        .send({ nome: 'X', documento: '123' });
      expect(r.status).toBe(422);
      expect(r.body.code).toBe('DOMAIN_VALIDATION');
    });
    it('documento com dígitos todos iguais → 422', () =>
      request(server)
        .post(url('/clientes'))
        .set(...bearer(op))
        .send({ nome: 'X', documento: '00000000000' })
        .expect(422));
    it('CPF válido (11 dígitos) → 201', () =>
      request(server)
        .post(url('/clientes'))
        .set(...bearer(op))
        .send({ nome: 'PF', documento: '52998224725' })
        .expect(201));
  });

  describe('Recurso não encontrado (404)', () => {
    it('GET tipo inexistente → 404 NOT_FOUND', async () => {
      const r = await request(server)
        .get(url('/tipos-transporte/nope'))
        .set(...bearer(op));
      expect(r.status).toBe(404);
      expect(r.body.code).toBe('NOT_FOUND');
    });
    it('PATCH tipo inexistente → 404', () =>
      request(server)
        .patch(url('/tipos-transporte/nope'))
        .set(...bearer(op))
        .send({ nome: 'X' })
        .expect(404));
    it('GET item inexistente → 404', () =>
      request(server)
        .get(url('/itens/nope'))
        .set(...bearer(op))
        .expect(404));
    it('GET cliente inexistente → 404', () =>
      request(server)
        .get(url('/clientes/nope'))
        .set(...bearer(op))
        .expect(404));
    it('PATCH cliente inexistente → 404', () =>
      request(server)
        .patch(url('/clientes/nope'))
        .set(...bearer(op))
        .send({ nome: 'X' })
        .expect(404));
    it('autorizar transporte inexistente → 404', () =>
      request(server)
        .post(url(`/clientes/${clienteId}/transportes`))
        .set(...bearer(op))
        .send({ tipoTransporteId: 'nope' })
        .expect(404));
    it('autorizar em cliente inexistente → 404', () =>
      request(server)
        .post(url('/clientes/nope/transportes'))
        .set(...bearer(op))
        .send({ tipoTransporteId: tipoAId })
        .expect(404));
    it('GET OV inexistente → 404', () =>
      request(server)
        .get(url('/ordens-venda/nope'))
        .set(...bearer(op))
        .expect(404));
    it('transição em OV inexistente → 404', () =>
      request(server)
        .patch(url('/ordens-venda/nope/status'))
        .set(...bearer(op))
        .send({ status: 'PLANEJADA' })
        .expect(404));
    it('alterar transporte em OV inexistente → 404', () =>
      request(server)
        .patch(url('/ordens-venda/nope/transporte'))
        .set(...bearer(op))
        .send({ tipoTransporteId: tipoAId })
        .expect(404));
    it('agendamento em OV inexistente → 404', () =>
      request(server)
        .post(url('/ordens-venda/nope/agendamento'))
        .set(...bearer(op))
        .send({ dataEntrega: '2026-07-15', janelaInicio: '08:00', janelaFim: '12:00' })
        .expect(404));
  });

  describe('Máquina de estados (transições)', () => {
    it('CRIADA → AGENDADA é inválida → 422 BUSINESS_RULE', async () => {
      const id = await novaOV();
      const r = await request(server)
        .patch(url(`/ordens-venda/${id}/status`))
        .set(...bearer(op))
        .send({ status: 'AGENDADA' });
      expect(r.status).toBe(422);
      expect(r.body.code).toBe('BUSINESS_RULE');
    });
    it('CRIADA → EM_TRANSPORTE é inválida → 422', async () => {
      const id = await novaOV();
      await request(server)
        .patch(url(`/ordens-venda/${id}/status`))
        .set(...bearer(op))
        .send({ status: 'EM_TRANSPORTE' })
        .expect(422);
    });
    it('CRIADA → ENTREGUE é inválida → 422', async () => {
      const id = await novaOV();
      await request(server)
        .patch(url(`/ordens-venda/${id}/status`))
        .set(...bearer(op))
        .send({ status: 'ENTREGUE' })
        .expect(422);
    });
    it('CRIADA → PLANEJADA é válida → 200', async () => {
      const id = await novaOV();
      await request(server)
        .patch(url(`/ordens-venda/${id}/status`))
        .set(...bearer(op))
        .send({ status: 'PLANEJADA' })
        .expect(200);
    });
    it('PLANEJADA → AGENDADA sem agendamento confirmado → 422', async () => {
      const id = await ovPlanejada();
      await request(server)
        .patch(url(`/ordens-venda/${id}/status`))
        .set(...bearer(op))
        .send({ status: 'AGENDADA' })
        .expect(422);
    });
    it('retrocesso PLANEJADA → CRIADA → 422', async () => {
      const id = await ovPlanejada();
      await request(server)
        .patch(url(`/ordens-venda/${id}/status`))
        .set(...bearer(op))
        .send({ status: 'CRIADA' })
        .expect(422);
    });
    it('saída de estado terminal ENTREGUE → 422', async () => {
      const id = await ovPlanejada();
      await request(server)
        .post(url(`/ordens-venda/${id}/agendamento`))
        .set(...bearer(op))
        .send({ dataEntrega: '2026-07-15', janelaInicio: '08:00', janelaFim: '12:00' })
        .expect(201);
      await request(server)
        .post(url(`/ordens-venda/${id}/agendamento/confirmar`))
        .set(...bearer(op))
        .expect(201);
      await request(server)
        .patch(url(`/ordens-venda/${id}/status`))
        .set(...bearer(op))
        .send({ status: 'AGENDADA' })
        .expect(200);
      await request(server)
        .patch(url(`/ordens-venda/${id}/status`))
        .set(...bearer(op))
        .send({ status: 'EM_TRANSPORTE' })
        .expect(200);
      await request(server)
        .patch(url(`/ordens-venda/${id}/status`))
        .set(...bearer(op))
        .send({ status: 'ENTREGUE' })
        .expect(200);
      await request(server)
        .patch(url(`/ordens-venda/${id}/status`))
        .set(...bearer(op))
        .send({ status: 'EM_TRANSPORTE' })
        .expect(422);
    });
  });

  describe('Regras de negócio da Ordem de Venda', () => {
    it('transporte não autorizado para o cliente → 422 BUSINESS_RULE', async () => {
      const r = await request(server)
        .post(url('/ordens-venda'))
        .set(...bearer(op))
        .send({
          clienteId,
          tipoTransporteId: tipoBId,
          itens: [{ itemId: itemXId, quantidade: 1 }],
        });
      expect(r.status).toBe(422);
      expect(r.body.code).toBe('BUSINESS_RULE');
    });
    it('cliente inexistente na criação → 404', () =>
      request(server)
        .post(url('/ordens-venda'))
        .set(...bearer(op))
        .send({
          clienteId: 'nope',
          tipoTransporteId: tipoAId,
          itens: [{ itemId: itemXId, quantidade: 1 }],
        })
        .expect(404));
    it('item inexistente na criação → 404', () =>
      request(server)
        .post(url('/ordens-venda'))
        .set(...bearer(op))
        .send({ clienteId, tipoTransporteId: tipoAId, itens: [{ itemId: 'nope', quantidade: 1 }] })
        .expect(404));
    it('itens duplicados na mesma OV → 422 DOMAIN_VALIDATION', async () => {
      const r = await request(server)
        .post(url('/ordens-venda'))
        .set(...bearer(op))
        .send({
          clienteId,
          tipoTransporteId: tipoAId,
          itens: [
            { itemId: itemXId, quantidade: 1 },
            { itemId: itemXId, quantidade: 2 },
          ],
        });
      expect(r.status).toBe(422);
      expect(r.body.code).toBe('DOMAIN_VALIDATION');
    });
    it('alterar transporte para não autorizado → 422', async () => {
      const id = await novaOV();
      await request(server)
        .patch(url(`/ordens-venda/${id}/transporte`))
        .set(...bearer(op))
        .send({ tipoTransporteId: tipoBId })
        .expect(422);
    });
    it('alterar transporte com OV AGENDADA → 422', async () => {
      const id = await ovPlanejada();
      await request(server)
        .post(url(`/ordens-venda/${id}/agendamento`))
        .set(...bearer(op))
        .send({ dataEntrega: '2026-07-15', janelaInicio: '08:00', janelaFim: '12:00' })
        .expect(201);
      await request(server)
        .post(url(`/ordens-venda/${id}/agendamento/confirmar`))
        .set(...bearer(op))
        .expect(201);
      await request(server)
        .patch(url(`/ordens-venda/${id}/status`))
        .set(...bearer(op))
        .send({ status: 'AGENDADA' })
        .expect(200);
      await request(server)
        .patch(url(`/ordens-venda/${id}/transporte`))
        .set(...bearer(op))
        .send({ tipoTransporteId: tipoAId })
        .expect(422);
    });
  });

  describe('Central de agendamento', () => {
    it('definir agendamento com OV em CRIADA → 422', async () => {
      const id = await novaOV();
      await request(server)
        .post(url(`/ordens-venda/${id}/agendamento`))
        .set(...bearer(op))
        .send({ dataEntrega: '2026-07-15', janelaInicio: '08:00', janelaFim: '12:00' })
        .expect(422);
    });
    it('data ISO inválida (ano de 5 dígitos) → 400', async () => {
      const id = await ovPlanejada();
      await request(server)
        .post(url(`/ordens-venda/${id}/agendamento`))
        .set(...bearer(op))
        .send({ dataEntrega: '20262-06-21', janelaInicio: '08:00', janelaFim: '12:00' })
        .expect(400);
    });
    it('janela em formato inválido → 400', async () => {
      const id = await ovPlanejada();
      await request(server)
        .post(url(`/ordens-venda/${id}/agendamento`))
        .set(...bearer(op))
        .send({ dataEntrega: '2026-07-15', janelaInicio: '8h', janelaFim: '12:00' })
        .expect(400);
    });
    it('janela início ≥ fim → 422 DOMAIN_VALIDATION', async () => {
      const id = await ovPlanejada();
      const r = await request(server)
        .post(url(`/ordens-venda/${id}/agendamento`))
        .set(...bearer(op))
        .send({ dataEntrega: '2026-07-15', janelaInicio: '12:00', janelaFim: '08:00' });
      expect(r.status).toBe(422);
      expect(r.body.code).toBe('DOMAIN_VALIDATION');
    });
    it('confirmar sem agendamento → 422', async () => {
      const id = await ovPlanejada();
      await request(server)
        .post(url(`/ordens-venda/${id}/agendamento/confirmar`))
        .set(...bearer(op))
        .expect(422);
    });
    it('reagendar sem agendamento → 422', async () => {
      const id = await ovPlanejada();
      await request(server)
        .patch(url(`/ordens-venda/${id}/agendamento`))
        .set(...bearer(op))
        .send({ dataEntrega: '2026-07-15', janelaInicio: '08:00', janelaFim: '12:00' })
        .expect(422);
    });
    it('reagendar reseta a confirmação (confirmado=false)', async () => {
      const id = await ovPlanejada();
      await request(server)
        .post(url(`/ordens-venda/${id}/agendamento`))
        .set(...bearer(op))
        .send({ dataEntrega: '2026-07-15', janelaInicio: '08:00', janelaFim: '12:00' })
        .expect(201);
      await request(server)
        .post(url(`/ordens-venda/${id}/agendamento/confirmar`))
        .set(...bearer(op))
        .expect(201);
      const r = await request(server)
        .patch(url(`/ordens-venda/${id}/agendamento`))
        .set(...bearer(op))
        .send({ dataEntrega: '2026-07-16', janelaInicio: '09:00', janelaFim: '11:00' })
        .expect(200);
      expect(r.body.agendamento.confirmado).toBe(false);
      expect(r.body.agendamento.janelaInicio).toBe('09:00');
      await request(server)
        .patch(url(`/ordens-venda/${id}/status`))
        .set(...bearer(op))
        .send({ status: 'AGENDADA' })
        .expect(422);
    });
  });

  describe('Auditoria e monitoramento', () => {
    it('auditoria sem token → 401', () => request(server).get(url('/auditoria')).expect(401));
    it('monitoramento com filtros + período → 200', () =>
      request(server)
        .get(
          url(
            `/ordens-venda?status=CRIADA&clienteId=${clienteId}&tipoTransporteId=${tipoAId}&criadoDe=2026-01-01&criadoAte=2027-01-01`,
          ),
        )
        .set(...bearer(op))
        .expect(200));
    it('a trilha registra os eventos do ciclo de uma OV', async () => {
      const id = await ovPlanejada();
      await request(server)
        .post(url(`/ordens-venda/${id}/agendamento`))
        .set(...bearer(op))
        .send({ dataEntrega: '2026-07-15', janelaInicio: '08:00', janelaFim: '12:00' })
        .expect(201);
      await request(server)
        .post(url(`/ordens-venda/${id}/agendamento/confirmar`))
        .set(...bearer(op))
        .expect(201);

      const res = await request(server)
        .get(url(`/auditoria?entidadeId=${id}`))
        .set(...bearer(aud))
        .expect(200);
      const acoes = (res.body.data as Array<{ acao: string }>).map((e) => e.acao);
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
});
