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
 * Refresh token (rotação single-use) e logout (denylist por jti) ponta a ponta.
 */
describe('OVGS API — Refresh & Logout (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Server;

  const url = (p: string) => `/api/v1${p}`;
  const bearer = (t: string) => ['Authorization', `Bearer ${t}`] as [string, string];

  async function login(): Promise<{ accessToken: string; refreshToken: string }> {
    const r = await request(server)
      .post(url('/auth/login'))
      .send({ email: 'operador@ovgs.dev', senha: 'operador123' })
      .expect(200);
    return { accessToken: r.body.accessToken, refreshToken: r.body.refreshToken };
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('login devolve accessToken e refreshToken', async () => {
    const { accessToken, refreshToken } = await login();
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');
    await request(server)
      .get(url('/clientes'))
      .set(...bearer(accessToken))
      .expect(200);
  });

  it('refresh emite novo par e ROTACIONA: o refresh antigo deixa de valer (401)', async () => {
    const { refreshToken } = await login();

    const r = await request(server).post(url('/auth/refresh')).send({ refreshToken }).expect(200);
    expect(r.body.accessToken).toEqual(expect.any(String));
    expect(r.body.refreshToken).toEqual(expect.any(String));
    expect(r.body.refreshToken).not.toBe(refreshToken);

    // novo access funciona
    await request(server)
      .get(url('/clientes'))
      .set(...bearer(r.body.accessToken))
      .expect(200);
    // refresh antigo (já rotacionado) é rejeitado → detecção de reuso
    await request(server).post(url('/auth/refresh')).send({ refreshToken }).expect(401);
    // o novo refresh funciona
    await request(server)
      .post(url('/auth/refresh'))
      .send({ refreshToken: r.body.refreshToken })
      .expect(200);
  });

  it('refresh inválido → 401', () =>
    request(server).post(url('/auth/refresh')).send({ refreshToken: 'nao-existe' }).expect(401));

  it('refresh sem corpo → 400', () =>
    request(server).post(url('/auth/refresh')).send({}).expect(400));

  it('logout revoga o access atual (denylist) e o refresh; logout sem token → 401', async () => {
    const { accessToken, refreshToken } = await login();

    // logout sem autenticação
    await request(server).post(url('/auth/logout')).send({ refreshToken }).expect(401);

    // confirma que o access funciona antes
    await request(server)
      .get(url('/clientes'))
      .set(...bearer(accessToken))
      .expect(200);

    // logout autenticado
    await request(server)
      .post(url('/auth/logout'))
      .set(...bearer(accessToken))
      .send({ refreshToken })
      .expect(204);

    // o MESMO access token agora está revogado (denylist) → 401
    await request(server)
      .get(url('/clientes'))
      .set(...bearer(accessToken))
      .expect(401);
    // o refresh também foi revogado → não renova
    await request(server).post(url('/auth/refresh')).send({ refreshToken }).expect(401);
  });
});
