import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { hashSync } from 'bcryptjs';
import { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/app.setup';
import { PrismaService } from '../src/shared/infrastructure/persistence/prisma.service';

/**
 * Suíte de RBAC ponta a ponta: cobre a MATRIZ COMPLETA de papéis (OPERADOR ×
 * AUDITOR × anônimo) sobre todos os endpoints, a localização (PT) das mensagens
 * de 401/403, o parsing estrito do header Bearer e a robustez do token (não
 * escalável por adulteração / expiração). Complementa app.e2e e edge-cases, que
 * cobriam apenas 1 negação de escrita do AUDITOR.
 */
describe('OVGS API — RBAC e permissões (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let server: Server;
  let op: string; // token OPERADOR
  let aud: string; // token AUDITOR

  let tipoAId: string; // autorizado p/ o cliente
  let tipoBId: string; // NÃO autorizado
  let itemId: string;
  let clienteId: string;
  let ovPlanejadaId: string;

  const url = (p: string) => `/api/v1${p}`;
  const bearer = (t: string) => ['Authorization', `Bearer ${t}`] as [string, string];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    server = app.getHttpServer() as Server;

    await prisma.client.$executeRawUnsafe(
      'TRUNCATE TABLE "audit_events","agendamentos","itens_ordem_venda","ordens_venda",' +
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
        .send({ nome: 'Bi-truck', codigo: 'BIT' })
        .expect(201)
    ).body.id;
    itemId = (
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
        .send({ nome: 'Cliente', documento: '11222333000181' })
        .expect(201)
    ).body.id;
    await request(server)
      .post(url(`/clientes/${clienteId}/transportes`))
      .set(...bearer(op))
      .send({ tipoTransporteId: tipoAId })
      .expect(201);

    ovPlanejadaId = (
      await request(server)
        .post(url('/ordens-venda'))
        .set(...bearer(op))
        .send({ clienteId, tipoTransporteId: tipoAId, itens: [{ itemId, quantidade: 1 }] })
        .expect(201)
    ).body.id;
    await request(server)
      .patch(url(`/ordens-venda/${ovPlanejadaId}/status`))
      .set(...bearer(op))
      .send({ status: 'PLANEJADA' })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  // ---- matriz declarativa -------------------------------------------------
  type Caso = {
    nome: string;
    metodo: 'post' | 'patch' | 'delete';
    path: () => string;
    body?: object;
  };
  const escrita = (): Caso[] => [
    {
      nome: 'POST /tipos-transporte',
      metodo: 'post',
      path: () => '/tipos-transporte',
      body: { nome: 'N', codigo: 'NN1' },
    },
    {
      nome: 'PATCH /tipos-transporte/:id',
      metodo: 'patch',
      path: () => `/tipos-transporte/${tipoAId}`,
      body: { nome: 'N' },
    },
    {
      nome: 'POST /itens',
      metodo: 'post',
      path: () => '/itens',
      body: { sku: 'NS', descricao: 'd', unidade: 'UN' },
    },
    {
      nome: 'POST /clientes',
      metodo: 'post',
      path: () => '/clientes',
      body: { nome: 'N', documento: '52998224725' },
    },
    {
      nome: 'PATCH /clientes/:id',
      metodo: 'patch',
      path: () => `/clientes/${clienteId}`,
      body: { nome: 'N' },
    },
    {
      nome: 'POST /clientes/:id/transportes',
      metodo: 'post',
      path: () => `/clientes/${clienteId}/transportes`,
      body: { tipoTransporteId: tipoBId },
    },
    {
      nome: 'DELETE /clientes/:id/transportes/:tt',
      metodo: 'delete',
      path: () => `/clientes/${clienteId}/transportes/${tipoAId}`,
    },
    {
      nome: 'POST /ordens-venda',
      metodo: 'post',
      path: () => '/ordens-venda',
      body: { clienteId, tipoTransporteId: tipoAId, itens: [{ itemId, quantidade: 1 }] },
    },
    {
      nome: 'PATCH /ordens-venda/:id/status',
      metodo: 'patch',
      path: () => `/ordens-venda/${ovPlanejadaId}/status`,
      body: { status: 'AGENDADA' },
    },
    {
      nome: 'PATCH /ordens-venda/:id/transporte',
      metodo: 'patch',
      path: () => `/ordens-venda/${ovPlanejadaId}/transporte`,
      body: { tipoTransporteId: tipoAId },
    },
    {
      nome: 'POST /ordens-venda/:id/agendamento',
      metodo: 'post',
      path: () => `/ordens-venda/${ovPlanejadaId}/agendamento`,
      body: { dataEntrega: '2026-08-01', janelaInicio: '08:00', janelaFim: '12:00' },
    },
    {
      nome: 'POST /ordens-venda/:id/agendamento/confirmar',
      metodo: 'post',
      path: () => `/ordens-venda/${ovPlanejadaId}/agendamento/confirmar`,
    },
    {
      nome: 'PATCH /ordens-venda/:id/agendamento',
      metodo: 'patch',
      path: () => `/ordens-venda/${ovPlanejadaId}/agendamento`,
      body: { dataEntrega: '2026-08-01', janelaInicio: '08:00', janelaFim: '12:00' },
    },
  ];
  const leitura = (): { nome: string; path: () => string }[] => [
    { nome: 'GET /clientes', path: () => '/clientes' },
    { nome: 'GET /clientes/:id', path: () => `/clientes/${clienteId}` },
    { nome: 'GET /tipos-transporte', path: () => '/tipos-transporte' },
    { nome: 'GET /tipos-transporte/:id', path: () => `/tipos-transporte/${tipoAId}` },
    { nome: 'GET /itens', path: () => '/itens' },
    { nome: 'GET /itens/:id', path: () => `/itens/${itemId}` },
    { nome: 'GET /ordens-venda', path: () => '/ordens-venda' },
    { nome: 'GET /ordens-venda/:id', path: () => `/ordens-venda/${ovPlanejadaId}` },
    { nome: 'GET /auditoria', path: () => '/auditoria' },
  ];

  describe('Escrita: exclusiva do OPERADOR', () => {
    it.each(escrita().map((c) => [c.nome, c] as const))('AUDITOR → 403 em %s', async (_n, c) => {
      const req = request(server)
        [c.metodo](url(c.path()))
        .set(...bearer(aud));
      await (c.body ? req.send(c.body) : req).expect(403);
    });
    it.each(escrita().map((c) => [c.nome, c] as const))('anônimo → 401 em %s', async (_n, c) => {
      const req = request(server)[c.metodo](url(c.path()));
      await (c.body ? req.send(c.body) : req).expect(401);
    });
  });

  describe('Leitura: liberada para ambos os papéis, bloqueada para anônimo', () => {
    it.each(leitura().map((c) => [c.nome, c] as const))('AUDITOR → 200 em %s', (_n, c) =>
      request(server)
        .get(url(c.path()))
        .set(...bearer(aud))
        .expect(200),
    );
    it.each(leitura().map((c) => [c.nome, c] as const))('OPERADOR → 200 em %s', (_n, c) =>
      request(server)
        .get(url(c.path()))
        .set(...bearer(op))
        .expect(200),
    );
    it.each(leitura().map((c) => [c.nome, c] as const))('anônimo → 401 em %s', (_n, c) =>
      request(server).get(url(c.path())).expect(401),
    );
  });

  describe('Mensagens localizadas (PT) e códigos semânticos', () => {
    it('403 do AUDITOR: code=FORBIDDEN, mensagem em PT nomeando OPERADOR (não "Forbidden resource")', async () => {
      const r = await request(server)
        .post(url('/tipos-transporte'))
        .set(...bearer(aud))
        .send({ nome: 'N', codigo: 'PT1' });
      expect(r.status).toBe(403);
      expect(r.body.code).toBe('FORBIDDEN');
      expect(r.body.message).toContain('OPERADOR');
      expect(r.body.message).toMatch(/acesso negado/i);
      expect(r.body.message).not.toBe('Forbidden resource');
    });
    it('401 sem token: code=UNAUTHORIZED, mensagem em PT (não "Unauthorized")', async () => {
      const r = await request(server).get(url('/clientes'));
      expect(r.status).toBe(401);
      expect(r.body.code).toBe('UNAUTHORIZED');
      expect(r.body.message).toMatch(/autentica/i);
      expect(r.body.message).not.toBe('Unauthorized');
    });
  });

  describe('Parsing estrito do header Bearer', () => {
    it('aceita "Bearer <token>" → 200', () =>
      request(server).get(url('/clientes')).set('Authorization', `Bearer ${op}`).expect(200));
    it('rejeita esquema minúsculo "bearer <token>" → 401', () =>
      request(server).get(url('/clientes')).set('Authorization', `bearer ${op}`).expect(401));
    it('rejeita sufixo extra "Bearer <token> extra" → 401', () =>
      request(server).get(url('/clientes')).set('Authorization', `Bearer ${op} extra`).expect(401));
    it('rejeita "Bearer" sem token → 401', () =>
      request(server).get(url('/clientes')).set('Authorization', 'Bearer').expect(401));
    it('rejeita esquema "Basic" → 401', () =>
      request(server).get(url('/clientes')).set('Authorization', `Basic ${op}`).expect(401));
    it('rejeita token cru sem esquema → 401', () =>
      request(server).get(url('/clientes')).set('Authorization', op).expect(401));
  });

  describe('Robustez do token (RBAC não escalável)', () => {
    it('payload adulterado (AUDITOR→OPERADOR, assinatura original) → 401', async () => {
      const [h, p, s] = aud.split('.');
      const json = JSON.parse(Buffer.from(p, 'base64url').toString());
      json.papel = 'OPERADOR';
      const pAlt = Buffer.from(JSON.stringify(json)).toString('base64url');
      const adulterado = `${h}.${pAlt}.${s}`;
      await request(server)
        .post(url('/tipos-transporte'))
        .set('Authorization', `Bearer ${adulterado}`)
        .send({ nome: 'N', codigo: 'TMP' })
        .expect(401);
    });
    it('token expirado (assinatura válida) → 401', async () => {
      const expirado = jwt.sign(
        { sub: 'x', email: 'x@x.dev', papel: 'OPERADOR' },
        { expiresIn: '-1h' },
      );
      await request(server)
        .get(url('/clientes'))
        .set('Authorization', `Bearer ${expirado}`)
        .expect(401);
    });
    it('AUDITOR negado NÃO causa efeito colateral (nada é criado)', async () => {
      const antes = (
        await request(server)
          .get(url('/tipos-transporte'))
          .set(...bearer(op))
      ).body.length;
      await request(server)
        .post(url('/tipos-transporte'))
        .set(...bearer(aud))
        .send({ nome: 'NaoDeveExistir', codigo: 'NDE' })
        .expect(403);
      const res = await request(server)
        .get(url('/tipos-transporte'))
        .set(...bearer(op));
      expect(res.body.length).toBe(antes);
      expect((res.body as Array<{ codigo: string }>).some((t) => t.codigo === 'NDE')).toBe(false);
    });
  });
});
