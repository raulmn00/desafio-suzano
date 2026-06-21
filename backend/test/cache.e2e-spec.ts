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
 * Cache de catálogo: a lista de tipos de transporte é cacheada (TTL) e
 * invalidada na escrita pela API. Provamos o cache SERVINDO (uma inserção feita
 * direto no banco, fora da API, não aparece enquanto o cache vale) e a
 * INVALIDAÇÃO (uma criação via API recarrega a lista).
 */
describe('OVGS API — Cache de catálogo (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Server;
  let op: string;

  const url = (p: string) => `/api/v1${p}`;
  const bearer = (t: string) => ['Authorization', `Bearer ${t}`] as [string, string];
  const codigos = (body: Array<{ codigo: string }>) => body.map((t) => t.codigo);

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('serve do cache (hit) e invalida na escrita pela API', async () => {
    // 1) primeira leitura popula o cache
    await request(server)
      .get(url('/tipos-transporte'))
      .set(...bearer(op))
      .expect(200);

    // 2) inserção DIRETA no banco (fora da API → não invalida o cache)
    await prisma.client.tipoTransporte.create({
      data: { id: randomUUID(), nome: 'Fantasma', codigo: 'GHOST' },
    });

    // 3) leitura dentro do TTL → cache HIT: o 'GHOST' NÃO aparece
    const cacheada = await request(server)
      .get(url('/tipos-transporte'))
      .set(...bearer(op))
      .expect(200);
    expect(codigos(cacheada.body)).not.toContain('GHOST');

    // 4) criação via API → invalida o cache
    await request(server)
      .post(url('/tipos-transporte'))
      .set(...bearer(op))
      .send({ nome: 'Caminhão', codigo: 'CAM' })
      .expect(201);

    // 5) leitura recarregada → contém o criado via API E o 'GHOST' (lista fresca)
    const fresca = await request(server)
      .get(url('/tipos-transporte'))
      .set(...bearer(op))
      .expect(200);
    expect(codigos(fresca.body)).toEqual(expect.arrayContaining(['CAM', 'GHOST']));
  });
});
