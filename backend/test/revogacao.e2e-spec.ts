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
 * Revogação server-side: a JwtStrategy revalida o token contra o estado ATUAL do
 * usuário no banco. Estes testes provam que desativar/rebaixar/promover um
 * usuário tem efeito IMEDIATO sobre um token já emitido (sem esperar expirar).
 */
describe('OVGS API — Revogação server-side (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Server;
  let op: string;
  let aud: string;

  const url = (p: string) => `/api/v1${p}`;
  const bearer = (t: string) => ['Authorization', `Bearer ${t}`] as [string, string];
  let seq = 0;
  const tipo = () => ({ nome: `T${(seq += 1)}`, codigo: `RV${seq}` });

  const setUsuario = (email: string, data: { ativo?: boolean; papel?: 'OPERADOR' | 'AUDITOR' }) =>
    prisma.client.usuario.update({ where: { email }, data });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = app.get(PrismaService);
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
    ).body.accessToken;
    aud = (
      await request(server)
        .post(url('/auth/login'))
        .send({ email: 'auditor@ovgs.dev', senha: 'auditor123' })
    ).body.accessToken;
  });

  afterEach(async () => {
    // restaura o estado base entre os testes
    await setUsuario('operador@ovgs.dev', { ativo: true, papel: 'OPERADOR' });
    await setUsuario('auditor@ovgs.dev', { ativo: true, papel: 'AUDITOR' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('desativar o usuário invalida o token já emitido na hora (401)', async () => {
    await request(server)
      .get(url('/clientes'))
      .set(...bearer(op))
      .expect(200);

    await setUsuario('operador@ovgs.dev', { ativo: false });

    const r = await request(server)
      .get(url('/clientes'))
      .set(...bearer(op));
    expect(r.status).toBe(401);
    expect(r.body.code).toBe('UNAUTHORIZED');
  });

  it('rebaixar OPERADOR→AUDITOR tira a escrita do token na hora (403)', async () => {
    await request(server)
      .post(url('/tipos-transporte'))
      .set(...bearer(op))
      .send(tipo())
      .expect(201);

    await setUsuario('operador@ovgs.dev', { papel: 'AUDITOR' });

    const r = await request(server)
      .post(url('/tipos-transporte'))
      .set(...bearer(op))
      .send(tipo());
    expect(r.status).toBe(403);
    expect(r.body.code).toBe('FORBIDDEN');
  });

  it('promover AUDITOR→OPERADOR concede escrita ao token na hora (201)', async () => {
    await request(server)
      .post(url('/tipos-transporte'))
      .set(...bearer(aud))
      .send(tipo())
      .expect(403);

    await setUsuario('auditor@ovgs.dev', { papel: 'OPERADOR' });

    await request(server)
      .post(url('/tipos-transporte'))
      .set(...bearer(aud))
      .send(tipo())
      .expect(201);
  });
});
