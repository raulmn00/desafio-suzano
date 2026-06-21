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
 * Hardening HTTP: security headers (helmet), rate-limit no login (anti
 * brute-force) e limite de tamanho do corpo. A janela do throttler é a
 * suíte inteira, então o teste de rate-limit roda por ÚLTIMO (esgota a cota
 * de /auth/login) e os demais não dependem dele.
 */
describe('OVGS API — Hardening HTTP (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Server;

  const url = (p: string) => `/api/v1${p}`;
  const credenciais = { email: 'operador@ovgs.dev', senha: 'operador123' };

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
        email: credenciais.email,
        nome: 'Operador',
        senhaHash: hashSync(credenciais.senha, 8),
        papel: 'OPERADOR',
        ativo: true,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('aplica security headers (helmet) e remove o X-Powered-By', async () => {
    const r = await request(server).get('/health').expect(200);
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['x-powered-by']).toBeUndefined();
  });

  it('rejeita corpo acima do limite com 413', async () => {
    const gigante = { email: 'a'.repeat(200 * 1024), senha: 'x' };
    await request(server).post(url('/auth/login')).send(gigante).expect(413);
  });

  it('rate-limit: o 11º login dentro da janela é bloqueado com 429', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      const r = await request(server).post(url('/auth/login')).send(credenciais);
      statuses.push(r.status);
    }
    // os 10 primeiros passam (200), o 11º estoura o limite (429)
    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(200));
    expect(statuses[10]).toBe(429);
  });
});
